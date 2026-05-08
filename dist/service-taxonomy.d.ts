export declare const allowedServiceTags: readonly ["vCISO", "IdentityAccessReview", "M365EntraSecurityReview", "IncidentResponseReadiness", "SecurityAwarenessProgram", "VulnerabilityAssessment", "PenetrationTesting", "ThirdPartyRiskAssessment"];
export type CraInterpretationServiceTag = (typeof allowedServiceTags)[number];
export declare function isCraInterpretationServiceTag(value: string): value is CraInterpretationServiceTag;
