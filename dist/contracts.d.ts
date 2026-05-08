import type { CraInterpretationServiceTag } from "./service-taxonomy.js";
export declare const CRA_INTERPRETATION_DOMAINS: readonly ["Governance and Risk Management", "Identity and Access", "Human Risk and Awareness", "Technology Protection", "Vulnerability and Exposure Management", "Detection and Monitoring", "Incident Response and Resilience", "Third-Party and External Dependency Risk"];
export type CraInterpretationDomain = (typeof CRA_INTERPRETATION_DOMAINS)[number];
export type CraInterpretationInput = {
    answersJson: Record<string, string>;
    scoring: {
        residualRiskRating?: string;
        domainScores?: Array<{
            domain: string;
            score: number;
        }>;
    };
};
export type CraInterpretationManifestMetadata = {
    manifestId: string;
    manifestVersion: string;
    status: "draft" | "approved";
    owner: string;
    compatibility: {
        questionnaireVersion: string;
        scoringVersion: string;
        minEngineVersion?: string;
    };
};
export type CraInterpretationOutput = {
    strengths: string[];
    concerns: string[];
    advisoryInterpretations: string[];
    validationPrompts: string[];
    recommendedActions: string[];
    serviceTags: CraInterpretationServiceTag[];
    manifestVersion: string;
};
