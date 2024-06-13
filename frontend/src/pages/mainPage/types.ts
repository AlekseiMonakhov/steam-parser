export interface PZCoefficient {
    price: string;
    coefficientPZ: number;
}

export interface Item {
    market_name: string;
    coefficientL: number;
    coefficientSR: number;
    coefficientV: number;
    coefficientP: number;
    coefficientPZ: PZCoefficient[];
}