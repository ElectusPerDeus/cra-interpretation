import { allowedServiceTags, type CraInterpretationServiceTag } from "./service-taxonomy.js";

const serviceLabelMap: Record<CraInterpretationServiceTag, string> = {
  VulnerabilityAssessment: "Vulnerability Assessment",
  PenetrationTesting: "Penetration Testing",
  IncidentResponseReadiness: "Incident Response Readiness",
  M365EntraSecurityReview: "M365 / Entra Security Review",
  SecurityAwarenessProgram: "Security Awareness Program",
  IdentityAccessReview: "Identity and Access Review",
  ThirdPartyRiskAssessment: "Third-Party Risk Assessment",
  vCISO: "Virtual CISO Advisory",
};

export function mapServiceTagsToLabels(tags: string[], max = Number.POSITIVE_INFINITY): {
  tags: CraInterpretationServiceTag[];
  labels: string[];
} {
  const mapped: CraInterpretationServiceTag[] = [];
  const seen = new Set<string>();

  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) {
      continue;
    }

    if (!(allowedServiceTags as readonly string[]).includes(tag)) {
      continue;
    }

    const typedTag = tag as CraInterpretationServiceTag;
    mapped.push(typedTag);
    seen.add(tag);

    if (mapped.length >= max) {
      break;
    }
  }

  return {
    tags: mapped,
    labels: mapped.map((tag) => serviceLabelMap[tag]),
  };
}

export { serviceLabelMap };
