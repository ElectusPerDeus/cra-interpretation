import { type CraInterpretationInput, type CraInterpretationOutput } from "./contracts.js";
import type { CraInterpretationManifest } from "./manifest-types.js";
export declare function getCraInterpretationManifest(): CraInterpretationManifest;
export declare function validateManifestSchemaShape(manifest: CraInterpretationManifest): string[];
export declare function validateServiceTags(manifest: CraInterpretationManifest): string[];
export declare function validateManifestReferences(manifest: CraInterpretationManifest): string[];
export declare function evaluateCraInterpretation(input: CraInterpretationInput, manifest?: CraInterpretationManifest): CraInterpretationOutput;
