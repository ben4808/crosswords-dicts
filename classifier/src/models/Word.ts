import { QualityClass } from "./QualityClass";

export interface Word {
    word: string;
    qualityClass: QualityClass;
    categories: Map<string, boolean>;
}