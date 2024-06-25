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
}

export interface DataTableRowProps {
    item: Item;
    handleOpen: (pzData: PZCoefficient[], itemName: string) => void;
    gameCode: number;
}

export interface DataTableProps {
    data: Item[];
    sortConfig: { key: string, direction: 'asc' | 'desc' };
    handleSort: (key: string) => void;
    handleOpen: (pzData: PZCoefficient[], itemName: string) => void;
    gameCode: number;
}