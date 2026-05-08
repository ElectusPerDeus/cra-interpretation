export const allowedServiceTags = [
  "vCISO",
  "IdentityAccessReview",
  "M365EntraSecurityReview",
  "IncidentResponseReadiness",
  "SecurityAwarenessProgram",
  "VulnerabilityAssessment",
  "PenetrationTesting",
  "ThirdPartyRiskAssessment",
] as const;

export type CraInterpretationServiceTag = (typeof allowedServiceTags)[number];

export function isCraInterpretationServiceTag(value: string): value is CraInterpretationServiceTag {
  return (allowedServiceTags as readonly string[]).includes(value);
}
