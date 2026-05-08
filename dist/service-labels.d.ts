import { type CraInterpretationServiceTag } from "./service-taxonomy.js";
declare const serviceLabelMap: Record<CraInterpretationServiceTag, string>;
export declare function mapServiceTagsToLabels(tags: string[], max?: number): {
    tags: CraInterpretationServiceTag[];
    labels: string[];
};
export { serviceLabelMap };
