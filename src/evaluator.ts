import manifestData from "../manifest/manifest.v1.json" with { type: "json" };
import manifestSchema from "../manifest/manifest.schema.json" with { type: "json" };
import { CRA_INTERPRETATION_DOMAINS, type CraInterpretationInput, type CraInterpretationOutput } from "./contracts.js";
import type {
  BaseRule,
  CraInterpretationManifest,
  InterpretationPriority,
  Predicate,
} from "./manifest-types.js";
import { allowedServiceTags, type CraInterpretationServiceTag } from "./service-taxonomy.js";

type QuestionOptionIndex = Map<string, Set<string>>;

const PRIORITY_WEIGHT: Record<InterpretationPriority, number> = {
  P1: 100,
  P2: 70,
  P3: 40,
  P4: 20,
};

const canonicalQuestionOptionIndex = buildQuestionOptionIndexFromManifest(
  manifestData as CraInterpretationManifest,
);

function asManifest(input: unknown): CraInterpretationManifest {
  return input as CraInterpretationManifest;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function hasRequiredTopLevelFields(manifest: CraInterpretationManifest): boolean {
  return Boolean(
    manifest.manifestId &&
      manifest.manifestVersion &&
      manifest.status &&
      manifest.owner &&
      manifest.compatibility?.questionnaireVersion &&
      manifest.compatibility?.scoringVersion &&
      manifest.serviceTagTaxonomy?.allowedTags &&
      manifest.rules,
  );
}

function isRuleShapeValid(rule: BaseRule): boolean {
  return Boolean(
    rule.interpretationId &&
      rule.version &&
      rule.scope &&
      (rule.domain === null || typeof rule.domain === "string") &&
      Array.isArray(rule.predicates) &&
      Array.isArray(rule.positiveSignals) &&
      Array.isArray(rule.riskConcerns) &&
      Array.isArray(rule.advisoryInterpretation) &&
      Array.isArray(rule.validationPrompts) &&
      Array.isArray(rule.recommendedNextActions) &&
      Array.isArray(rule.suggestedCyberSecEngagements) &&
      ["P1", "P2", "P3", "P4"].includes(rule.priority) &&
      ["increase", "neutral", "decrease"].includes(rule.confidenceImpact) &&
      typeof rule.enabled === "boolean",
  );
}

function evaluatePredicate(predicate: Predicate, input: CraInterpretationInput): boolean {
  if (predicate.type === "answer_equals") {
    if (!predicate.questionId || typeof predicate.value !== "string") {
      return false;
    }
    return input.answersJson[predicate.questionId] === predicate.value;
  }

  if (predicate.type === "answer_in") {
    if (!predicate.questionId || !Array.isArray(predicate.value)) {
      return false;
    }
    const current = input.answersJson[predicate.questionId];
    return predicate.value.includes(current);
  }

  if (predicate.type === "domain_score_gte") {
    if (!predicate.domain || typeof predicate.value !== "number") {
      return false;
    }
    const score = input.scoring.domainScores?.find((item) => item.domain === predicate.domain)?.score;
    return typeof score === "number" ? score >= predicate.value : false;
  }

  if (predicate.type === "domain_score_lte") {
    if (!predicate.domain || typeof predicate.value !== "number") {
      return false;
    }
    const score = input.scoring.domainScores?.find((item) => item.domain === predicate.domain)?.score;
    return typeof score === "number" ? score <= predicate.value : false;
  }

  if (predicate.type === "residual_risk_in") {
    if (!Array.isArray(predicate.value)) {
      return false;
    }
    return predicate.value.includes(input.scoring.residualRiskRating);
  }

  return false;
}

function sortRules(rules: BaseRule[]): BaseRule[] {
  return [...rules].sort((a, b) => {
    const delta = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (delta !== 0) {
      return delta;
    }
    return a.interpretationId.localeCompare(b.interpretationId);
  });
}

function pushUnique(target: string[], values: string[]): void {
  const existing = new Set(target);
  for (const value of values) {
    if (!existing.has(value)) {
      target.push(value);
      existing.add(value);
    }
  }
}

function dedupeAndSortServiceTags(serviceTags: string[]): CraInterpretationServiceTag[] {
  const filtered = serviceTags.filter((tag): tag is CraInterpretationServiceTag =>
    (allowedServiceTags as readonly string[]).includes(tag),
  );
  return Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b));
}

function triggeredAtomicRules(manifest: CraInterpretationManifest, input: CraInterpretationInput): BaseRule[] {
  return manifest.rules.atomic.filter(
    (rule) => rule.enabled && Boolean(rule.questionId && rule.optionId && input.answersJson[rule.questionId] === rule.optionId),
  );
}

function triggeredCompositeRules(manifest: CraInterpretationManifest, input: CraInterpretationInput): BaseRule[] {
  return manifest.rules.composite.filter(
    (rule) => rule.enabled && rule.predicates.every((predicate) => evaluatePredicate(predicate, input)),
  );
}

function triggeredDomainRollups(manifest: CraInterpretationManifest, input: CraInterpretationInput): BaseRule[] {
  return manifest.rules.domainRollup.filter(
    (rule) => rule.enabled && rule.predicates.every((predicate) => evaluatePredicate(predicate, input)),
  );
}

function buildQuestionOptionIndexFromManifest(manifest: CraInterpretationManifest): QuestionOptionIndex {
  const index = new Map<string, Set<string>>();

  const add = (questionId: string, optionId: string) => {
    const options = index.get(questionId) ?? new Set<string>();
    options.add(optionId);
    index.set(questionId, options);
  };

  for (const rule of manifest.rules.atomic) {
    if (rule.questionId && rule.optionId) {
      add(rule.questionId, rule.optionId);
    }
  }

  for (const rule of manifest.rules.composite) {
    for (const predicate of rule.predicates) {
      if ((predicate.type === "answer_equals" || predicate.type === "answer_in") && predicate.questionId) {
        if (predicate.type === "answer_equals" && typeof predicate.value === "string") {
          add(predicate.questionId, predicate.value);
        }
        if (predicate.type === "answer_in" && Array.isArray(predicate.value)) {
          for (const value of predicate.value) {
            if (typeof value === "string") {
              add(predicate.questionId, value);
            }
          }
        }
      }
    }
  }

  return index;
}

export function getCraInterpretationManifest(): CraInterpretationManifest {
  return asManifest(manifestData);
}

export function validateManifestSchemaShape(manifest: CraInterpretationManifest): string[] {
  const errors: string[] = [];

  if (!manifestSchema || typeof manifestSchema !== "object") {
    errors.push("manifest_schema_missing");
  }

  if (!hasRequiredTopLevelFields(manifest)) {
    errors.push("manifest_missing_required_top_level_fields");
    return errors;
  }

  const allRules = [
    ...manifest.rules.atomic,
    ...manifest.rules.composite,
    ...manifest.rules.domainRollup,
    ...manifest.rules.executiveRollup,
  ];

  for (const rule of allRules) {
    if (!isRuleShapeValid(rule)) {
      errors.push(`rule_invalid_shape:${rule.interpretationId}`);
    }

    if (rule.scope === "atomic" && (!rule.questionId || !rule.optionId)) {
      errors.push(`atomic_missing_question_or_option:${rule.interpretationId}`);
    }
  }

  return errors;
}

export function validateServiceTags(manifest: CraInterpretationManifest): string[] {
  const allowed = new Set(manifest.serviceTagTaxonomy.allowedTags);
  const errors: string[] = [];

  const allRules = [
    ...manifest.rules.atomic,
    ...manifest.rules.composite,
    ...manifest.rules.domainRollup,
    ...manifest.rules.executiveRollup,
  ];

  for (const rule of allRules) {
    for (const tag of asStringArray(rule.suggestedCyberSecEngagements)) {
      if (!allowed.has(tag)) {
        errors.push(`service_tag_not_allowed:${rule.interpretationId}:${tag}`);
      }
    }
  }

  return errors;
}

export function validateManifestReferences(manifest: CraInterpretationManifest): string[] {
  const errors: string[] = [];
  const index = canonicalQuestionOptionIndex;
  const knownDomains = new Set<string>(CRA_INTERPRETATION_DOMAINS);

  for (const rule of manifest.rules.atomic) {
    const optionSet = rule.questionId ? index.get(rule.questionId) : undefined;
    if (!optionSet) {
      errors.push(`orphaned_question:${rule.interpretationId}:${rule.questionId ?? "<null>"}`);
      continue;
    }
    if (!rule.optionId || !optionSet.has(rule.optionId)) {
      errors.push(`orphaned_option:${rule.interpretationId}:${rule.questionId}:${rule.optionId ?? "<null>"}`);
    }
  }

  const nonAtomicRules = [
    ...manifest.rules.composite,
    ...manifest.rules.domainRollup,
    ...manifest.rules.executiveRollup,
  ];

  for (const rule of nonAtomicRules) {
    if (rule.domain && !knownDomains.has(rule.domain)) {
      errors.push(`orphaned_domain:${rule.interpretationId}:${rule.domain}`);
    }

    for (const predicate of rule.predicates) {
      if ((predicate.type === "answer_equals" || predicate.type === "answer_in") && predicate.questionId) {
        const optionSet = index.get(predicate.questionId);
        if (!optionSet) {
          errors.push(`orphaned_predicate_question:${rule.interpretationId}:${predicate.questionId}`);
          continue;
        }

        if (predicate.type === "answer_equals") {
          const value = typeof predicate.value === "string" ? predicate.value : "";
          if (!optionSet.has(value)) {
            errors.push(`orphaned_predicate_option:${rule.interpretationId}:${predicate.questionId}:${value}`);
          }
        }

        if (predicate.type === "answer_in") {
          const values = Array.isArray(predicate.value)
            ? predicate.value.filter((entry): entry is string => typeof entry === "string")
            : [];
          for (const value of values) {
            if (!optionSet.has(value)) {
              errors.push(`orphaned_predicate_option:${rule.interpretationId}:${predicate.questionId}:${value}`);
            }
          }
        }
      }
    }
  }

  return errors;
}

export function evaluateCraInterpretation(
  input: CraInterpretationInput,
  manifest: CraInterpretationManifest = getCraInterpretationManifest(),
): CraInterpretationOutput {
  const schemaErrors = validateManifestSchemaShape(manifest);
  const referenceErrors = validateManifestReferences(manifest);
  const serviceErrors = validateServiceTags(manifest);

  if (schemaErrors.length > 0 || referenceErrors.length > 0 || serviceErrors.length > 0) {
    throw new Error(`manifest_validation_failed:${[...schemaErrors, ...referenceErrors, ...serviceErrors].join("|")}`);
  }

  const composite = sortRules(triggeredCompositeRules(manifest, input));
  const atomic = sortRules(triggeredAtomicRules(manifest, input));
  const domainRollup = sortRules(triggeredDomainRollups(manifest, input));

  const suppressedTopicKeys = new Set(
    composite
      .map((rule) => rule.topicKey)
      .filter((topic): topic is string => typeof topic === "string" && topic.length > 0),
  );

  const precedenceAtomic = atomic.filter((rule) => {
    if (!rule.topicKey) {
      return true;
    }
    return !suppressedTopicKeys.has(rule.topicKey);
  });

  const orderedRules = [...composite, ...precedenceAtomic, ...domainRollup];

  const strengths: string[] = [];
  const concerns: string[] = [];
  const advisoryInterpretations: string[] = [];
  const validationPrompts: string[] = [];
  const recommendedActions: string[] = [];
  const serviceTags: string[] = [];

  for (const rule of orderedRules) {
    pushUnique(strengths, asStringArray(rule.positiveSignals));
    pushUnique(concerns, asStringArray(rule.riskConcerns));
    pushUnique(advisoryInterpretations, asStringArray(rule.advisoryInterpretation));
    pushUnique(validationPrompts, asStringArray(rule.validationPrompts));
    pushUnique(recommendedActions, asStringArray(rule.recommendedNextActions));
    pushUnique(serviceTags, asStringArray(rule.suggestedCyberSecEngagements));
  }

  return {
    strengths,
    concerns,
    advisoryInterpretations,
    validationPrompts,
    recommendedActions,
    serviceTags: dedupeAndSortServiceTags(serviceTags),
    manifestVersion: manifest.manifestVersion,
  };
}
