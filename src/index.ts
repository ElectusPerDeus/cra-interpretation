import manifestData from "../manifest/manifest.v1.json" with { type: "json" };
import { buildCoverageMap } from "./coverage-map.js";
import type {
  CraInterpretationDomain,
  CraInterpretationInput,
  CraInterpretationManifestMetadata,
  CraInterpretationOutput,
} from "./contracts.js";
import {
  evaluateCraInterpretation,
  getCraInterpretationManifest,
  validateManifestReferences,
  validateManifestSchemaShape,
  validateServiceTags,
} from "./evaluator.js";
import { manifestHash } from "./manifest-hash.js";
import type { CraInterpretationManifest } from "./manifest-types.js";
import { mapServiceTagsToLabels, serviceLabelMap } from "./service-labels.js";
import { allowedServiceTags, type CraInterpretationServiceTag } from "./service-taxonomy.js";
import { evaluatorVersion } from "./version.js";

const manifest = manifestData as CraInterpretationManifest;
const manifestVersion = manifest.manifestVersion;

export {
  allowedServiceTags,
  buildCoverageMap,
  evaluateCraInterpretation,
  evaluatorVersion,
  getCraInterpretationManifest,
  manifest,
  manifestHash,
  manifestVersion,
  mapServiceTagsToLabels,
  serviceLabelMap,
  validateManifestReferences,
  validateManifestSchemaShape,
  validateServiceTags,
};

export type {
  CraInterpretationDomain,
  CraInterpretationInput,
  CraInterpretationManifest,
  CraInterpretationManifestMetadata,
  CraInterpretationOutput,
  CraInterpretationServiceTag,
};
