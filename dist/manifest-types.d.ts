import type { CraInterpretationManifestMetadata } from "./contracts.js";
export type InterpretationPriority = "P1" | "P2" | "P3" | "P4";
export type ConfidenceImpact = "increase" | "neutral" | "decrease";
export type RuleScope = "atomic" | "composite" | "domain_rollup" | "executive_rollup";
export type Predicate = {
    type: "answer_equals" | "answer_in" | "domain_score_gte" | "domain_score_lte" | "residual_risk_in";
    questionId?: string;
    domain?: string;
    operator: "eq" | "in" | "gte" | "lte";
    value?: unknown;
};
export type BaseRule = {
    interpretationId: string;
    version: string;
    scope: RuleScope;
    domain: string | null;
    questionId?: string | null;
    optionId?: string | null;
    topicKey?: string;
    predicates: Predicate[];
    positiveSignals: string[];
    riskConcerns: string[];
    advisoryInterpretation: string[];
    validationPrompts: string[];
    recommendedNextActions: string[];
    suggestedCyberSecEngagements: string[];
    priority: InterpretationPriority;
    confidenceImpact: ConfidenceImpact;
    enabled: boolean;
};
export type CraInterpretationManifest = CraInterpretationManifestMetadata & {
    serviceTagTaxonomy: {
        allowedTags: string[];
    };
    rules: {
        atomic: BaseRule[];
        composite: BaseRule[];
        domainRollup: BaseRule[];
        executiveRollup: BaseRule[];
    };
};
