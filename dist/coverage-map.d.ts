import type { CraInterpretationManifest } from "./manifest-types.js";
export type CoverageMapResult = {
    totalQuestions: number;
    totalOptions: number;
    coveredOptions: number;
    uncoveredOptions: string[];
    orphanedReferences: string[];
    domainsWithPositivePaths: string[];
    domainsMissingPositivePaths: string[];
};
export declare function buildCoverageMap(manifest?: CraInterpretationManifest): CoverageMapResult;
