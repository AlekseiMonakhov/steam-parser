import React from 'react';
import styles from './dataTableRow.module.css';
import IconButton from '@mui/material/IconButton';
import ChartIcon from '@mui/icons-material/BarChart';
import { DataTableRowProps } from "./types";



const DataTableRow: React.FC<DataTableRowProps> = ({ item, handleOpen, gameCode }) => {
    return (
        <div className={styles.tableRow}>
            <a href={`https://steamcommunity.com/market/listings/${gameCode}/${item.market_name}`}
               target="_blank" rel="noopener noreferrer" className={styles.marketName}>
                {item.market_name}
            </a>
            <div>{item.coefficientL}</div>
            <div>{Number(item.coefficientSR).toFixed(3)}</div>
            <div>{Number(item.coefficientSRN).toFixed(3)}</div>
            <div>{Number(item.coefficientV).toFixed(3)}</div>
            <div>{Number(item.coefficientP).toFixed(3)}</div>
            <div>{Number(item.coefficientPZ.coefficientPZ).toFixed(8)} | {Number(item.coefficientPZ.price).toFixed(3)}</div>
            <div>
                <IconButton onClick={() => handleOpen(item.top20PZCoefficients, item.market_name)}>
                    <ChartIcon/>
                </IconButton>
            </div>
        </div>
    );
};

export default DataTableRow;
