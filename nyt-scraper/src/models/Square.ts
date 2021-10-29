export interface Square {
    row: number;
    col: number;
    number?: number;
    directions: string[];
    isBlack: boolean;
    content: string;
    isCircled: boolean;
}