import { QualityClass } from "./QualityClass";

export interface Word {
    rawEntry: string;
    normalizedEntry: string;
    qualityClass: QualityClass;
    categories: Map<string, boolean>;
}