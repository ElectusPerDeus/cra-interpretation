import assert from "node:assert/strict";
import test from "node:test";
import { buildCoverageMap, getCraInterpretationManifest, type CraInterpretationManifest } from "../src/index.js";

function cloneManifest(): CraInterpretationManifest {
  return JSON.parse(JSON.stringify(getCraInterpretationManifest())) as CraInterpretationManifest;
}

test("coverage map reports totals and current coverage state", () => {
  const coverage = buildCoverageMap();

  assert.ok(coverage.totalQuestions > 0);
  assert.ok(coverage.totalOptions > 0);
  assert.ok(coverage.coveredOptions > 0);
  assert.ok(Array.isArray(coverage.uncoveredOptions));
  assert.equal(coverage.uncoveredOptions.length, 0);
});

test("coverage map reports all domains have at least one positive path", () => {
  const coverage = buildCoverageMap();
  assert.deepEqual(coverage.domainsMissingPositivePaths, []);
});

test("coverage map surfaces orphaned IDs for invalid manifest", () => {
  const manifest = cloneManifest();
  manifest.rules.atomic.push({
    ...manifest.rules.atomic[0],
    interpretationId: "atomic.coverage.orphan.v1",
    questionId: "ghost_question",
    optionId: "ghost_option",
  });

  const coverage = buildCoverageMap(manifest);
  assert.ok(coverage.orphanedReferences.some((item) => item.includes("orphaned_question")));
});
