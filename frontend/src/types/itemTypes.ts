export interface PZCoefficient {
    price: string;
    coefficientPZ: number;
}

export interface Item {
    market_name: string;
    coefficientL: number;
    coefficientSR: number;
    coefficientSRN: number;
    coefficientV: number;
    coefficientP: number;
    coefficientPZ: PZCoefficient;
    top100PZCoefficients: PZCoefficient[];
    rarity?: string;
    quality?: string;
    itemgroup?: string;
}