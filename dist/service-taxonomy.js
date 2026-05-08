export const allowedServiceTags = [
    "vCISO",
    "IdentityAccessReview",
    "M365EntraSecurityReview",
    "IncidentResponseReadiness",
    "SecurityAwarenessProgram",
    "VulnerabilityAssessment",
    "PenetrationTesting",
    "ThirdPartyRiskAssessment",
];
export function isCraInterpretationServiceTag(value) {
    return allowedServiceTags.includes(value);
}
