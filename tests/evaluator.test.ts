import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedServiceTags,
  evaluateCraInterpretation,
  getCraInterpretationManifest,
  mapServiceTagsToLabels,
  validateManifestReferences,
  validateManifestSchemaShape,
  validateServiceTags,
  type CraInterpretationInput,
  type CraInterpretationManifest,
} from "../src/index.js";

function cloneManifest(): CraInterpretationManifest {
  return JSON.parse(JSON.stringify(getCraInterpretationManifest())) as CraInterpretationManifest;
}

function baselineInput(): CraInterpretationInput {
  return {
    answersJson: {
      iam_mfa: "none",
      iam_access_reviews: "continuous",
      det_out_of_hours: "no",
      det_siem_mdr: "yes",
    },
    scoring: {
      residualRiskRating: "High",
      domainScores: [
        { domain: "Identity and Access", score: 35 },
        { domain: "Detection and Monitoring", score: 72 },
      ],
    },
  };
}

test("manifest schema shape validates for bundled manifest", () => {
  const manifest = getCraInterpretationManifest();
  const errors = validateManifestSchemaShape(manifest);
  assert.deepEqual(errors, []);
});

test("manifest references validate for bundled manifest", () => {
  const manifest = getCraInterpretationManifest();
  const errors = validateManifestReferences(manifest);
  assert.deepEqual(errors, []);
});

test("service tags are taxonomy-limited for bundled manifest", () => {
  const manifest = getCraInterpretationManifest();
  const errors = validateServiceTags(manifest);
  assert.deepEqual(errors, []);
});

test("evaluator output is deterministic for identical input", () => {
  const input = baselineInput();
  const first = evaluateCraInterpretation(input);
  const second = evaluateCraInterpretation(input);

  assert.deepEqual(first, second);
});

test("evaluator returns expected advisory sections and manifest version", () => {
  const output = evaluateCraInterpretation(baselineInput());

  assert.ok(output.strengths.length > 0);
  assert.ok(output.concerns.length > 0);
  assert.ok(output.validationPrompts.length > 0);
  assert.ok(output.recommendedActions.length > 0);
  assert.ok(output.serviceTags.length > 0);
  assert.equal(typeof output.manifestVersion, "string");
});

test("composite rules suppress same-topic atomic concern when both trigger", () => {
  const output = evaluateCraInterpretation(baselineInput());

  assert.ok(
    output.concerns.includes("Identity compromise likelihood and delayed detection risk are jointly elevated."),
    "Expected composite concern to be present",
  );

  assert.ok(
    !output.concerns.includes("Absence of MFA materially increases account compromise likelihood."),
    "Expected same-topic atomic concern to be suppressed by composite precedence",
  );
});

test("evaluator does not return raw answers payload", () => {
  const output = evaluateCraInterpretation(baselineInput()) as Record<string, unknown>;

  assert.equal(Object.prototype.hasOwnProperty.call(output, "answersJson"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(output, "answers"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(output, "rawAnswers"), false);
});

test("invalid service tags are detected", () => {
  const manifest = cloneManifest();
  manifest.rules.atomic[0].suggestedCyberSecEngagements = ["NotAllowedServiceTag"];

  const errors = validateServiceTags(manifest);
  assert.ok(errors.some((entry) => entry.includes("service_tag_not_allowed")));
});

test("orphaned question and option IDs are detected", () => {
  const manifest = cloneManifest();
  manifest.rules.atomic.push({
    ...manifest.rules.atomic[0],
    interpretationId: "atomic.bad.reference.v1",
    questionId: "not_a_real_question",
    optionId: "not_a_real_option",
  });

  const errors = validateManifestReferences(manifest);
  assert.ok(errors.some((entry) => entry.includes("orphaned_question")));
});

test("service label mapping covers all allowed canonical tags", () => {
  const mapped = mapServiceTagsToLabels([...allowedServiceTags], allowedServiceTags.length);
  assert.deepEqual(mapped.tags, [...allowedServiceTags]);
  assert.equal(mapped.labels.length, allowedServiceTags.length);
});
