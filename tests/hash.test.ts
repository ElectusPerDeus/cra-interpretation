import assert from "node:assert/strict";
import test from "node:test";
import manifestJson from "../manifest/manifest.v1.json" with { type: "json" };
import { createManifestHash, manifestHash } from "../src/manifest-hash.js";
import type { CraInterpretationManifest } from "../src/manifest-types.js";

test("manifestHash matches deterministic SHA-256 over canonical JSON", () => {
  const computed = createManifestHash(manifestJson as CraInterpretationManifest);
  assert.equal(manifestHash, computed);
  assert.match(manifestHash, /^[a-f0-9]{64}$/);
});
