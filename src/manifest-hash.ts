import { createHash } from "node:crypto";
import manifestData from "../manifest/manifest.v1.json" with { type: "json" };
import type { CraInterpretationManifest } from "./manifest-types.js";

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${canonicalize(val)}`)
    .join(",")}}`;
}

export function createManifestHash(manifest: CraInterpretationManifest): string {
  const canonical = canonicalize(manifest);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export const manifestHash = createManifestHash(manifestData as CraInterpretationManifest);
