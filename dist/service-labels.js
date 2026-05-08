import { allowedServiceTags } from "./service-taxonomy.js";
const serviceLabelMap = {
    VulnerabilityAssessment: "Vulnerability Assessment",
    PenetrationTesting: "Penetration Testing",
    IncidentResponseReadiness: "Incident Response Readiness",
    M365EntraSecurityReview: "M365 / Entra Security Review",
    SecurityAwarenessProgram: "Security Awareness Program",
    IdentityAccessReview: "Identity and Access Review",
    ThirdPartyRiskAssessment: "Third-Party Risk Assessment",
    vCISO: "Virtual CISO Advisory",
};
export function mapServiceTagsToLabels(tags, max = Number.POSITIVE_INFINITY) {
    const mapped = [];
    const seen = new Set();
    for (const rawTag of tags) {
        const tag = rawTag.trim();
        if (!tag || seen.has(tag)) {
            continue;
        }
        if (!allowedServiceTags.includes(tag)) {
            continue;
        }
        const typedTag = tag;
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
