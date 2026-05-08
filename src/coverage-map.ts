import manifestData from "../manifest/manifest.v1.json" with { type: "json" };
import type { CraInterpretationManifest } from "./manifest-types.js";
import { validateManifestReferences } from "./evaluator.js";

export type CoverageMapResult = {
  totalQuestions: number;
  totalOptions: number;
  coveredOptions: number;
  uncoveredOptions: string[];
  orphanedReferences: string[];
  domainsWithPositivePaths: string[];
  domainsMissingPositivePaths: string[];
};

type OptionKey = `${string}:${string}`;

function allQuestionOptionKeys(manifest: CraInterpretationManifest): Set<OptionKey> {
  const keys = new Set<OptionKey>();

  for (const rule of manifest.rules.atomic) {
    if (!rule.questionId || !rule.optionId) {
      continue;
    }
    keys.add(`${rule.questionId}:${rule.optionId}`);
  }

  for (const rule of manifest.rules.composite) {
    for (const predicate of rule.predicates) {
      if ((predicate.type === "answer_equals" || predicate.type === "answer_in") && predicate.questionId) {
        if (predicate.type === "answer_equals" && typeof predicate.value === "string") {
          keys.add(`${predicate.questionId}:${predicate.value}`);
        }
        if (predicate.type === "answer_in" && Array.isArray(predicate.value)) {
          for (const value of predicate.value) {
            if (typeof value === "string") {
              keys.add(`${predicate.questionId}:${value}`);
            }
          }
        }
      }
    }
  }

  return keys;
}

function optionKeysCovered(manifest: CraInterpretationManifest): Set<OptionKey> {
  const keys = new Set<OptionKey>();

  for (const rule of manifest.rules.atomic) {
    if (!rule.enabled || !rule.questionId || !rule.optionId) {
      continue;
    }
    keys.add(`${rule.questionId}:${rule.optionId}`);
  }

  for (const rule of manifest.rules.composite) {
    if (!rule.enabled) {
      continue;
    }

    for (const predicate of rule.predicates) {
      if ((predicate.type === "answer_equals" || predicate.type === "answer_in") && predicate.questionId) {
        if (predicate.type === "answer_equals" && typeof predicate.value === "string") {
          keys.add(`${predicate.questionId}:${predicate.value}`);
        }

        if (predicate.type === "answer_in" && Array.isArray(predicate.value)) {
          for (const value of predicate.value) {
            if (typeof value === "string") {
              keys.add(`${predicate.questionId}:${value}`);
            }
          }
        }
      }
    }
  }

  return keys;
}

function collectAllDomains(manifest: CraInterpretationManifest): string[] {
  const domains = new Set<string>();
  const allRules = [
    ...manifest.rules.atomic,
    ...manifest.rules.composite,
    ...manifest.rules.domainRollup,
    ...manifest.rules.executiveRollup,
  ];

  for (const rule of allRules) {
    if (rule.domain) {
      domains.add(rule.domain);
    }
  }

  return Array.from(domains).sort((a, b) => a.localeCompare(b));
}

function collectDomainsWithPositivePath(manifest: CraInterpretationManifest): Set<string> {
  const domains = new Set<string>();

  const allRules = [
    ...manifest.rules.atomic,
    ...manifest.rules.composite,
    ...manifest.rules.domainRollup,
    ...manifest.rules.executiveRollup,
  ];

  for (const rule of allRules) {
    if (!rule.enabled || !rule.domain) {
      continue;
    }
    if (rule.positiveSignals.length > 0) {
      domains.add(rule.domain);
    }
  }

  return domains;
}

export function buildCoverageMap(
  manifest: CraInterpretationManifest = manifestData as CraInterpretationManifest,
): CoverageMapResult {
  const allKeys = allQuestionOptionKeys(manifest);
  const covered = optionKeysCovered(manifest);

  const uncovered = Array.from(allKeys)
    .filter((key) => !covered.has(key))
    .sort((a, b) => a.localeCompare(b));

  const orphanedReferences = validateManifestReferences(manifest).sort((a, b) => a.localeCompare(b));

  const domainsWithPositiveSet = collectDomainsWithPositivePath(manifest);
  const domainsWithPositivePaths = Array.from(domainsWithPositiveSet).sort((a, b) => a.localeCompare(b));

  const knownDomains = collectAllDomains(manifest);
  const domainsMissingPositivePaths = knownDomains
    .filter((domain) => !domainsWithPositiveSet.has(domain))
    .sort((a, b) => a.localeCompare(b));

  const totalQuestionIds = new Set(Array.from(allKeys).map((key) => key.split(":", 1)[0]));

  return {
    totalQuestions: totalQuestionIds.size,
    totalOptions: allKeys.size,
    coveredOptions: covered.size,
    uncoveredOptions: uncovered,
    orphanedReferences,
    domainsWithPositivePaths,
    domainsMissingPositivePaths,
  };
}
