import React from 'react';
import styles from './dataTable.module.css';
import DataTableRow from './dataTableRow';
import { DataTableProps } from "./types";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';



const DataTable: React.FC<DataTableProps> = ({ data, sortConfig, handleSort, handleOpen, gameCode }) => {
    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) {
            return <ArrowUpwardIcon className={styles.sortIcon} />;
        }
        if (sortConfig.direction === 'asc') {
            return <ArrowUpwardIcon className={styles.sortIcon} />;
        }
        return <ArrowDownwardIcon className={styles.sortIcon} />;
    };

    return (
        <div className={styles.tableContainer}>
            <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <div>Предмет</div>
                <div onClick={() => handleSort('coefficientL')}>Л {getSortIcon('coefficientL')}</div>
                <div>СР</div>
                <div>СРН</div>
                <div onClick={() => handleSort('coefficientV')}>В {getSortIcon('coefficientV')}</div>
                <div>П</div>
                <div onClick={() => handleSort('coefficientPZ.coefficientPZ')}>ПЗ {getSortIcon('coefficientPZ.coefficientPZ')}</div>
                <div>График ПЗ</div>
            </div>
            {data.map((item, index) => (
                <DataTableRow key={index} item={item} handleOpen={handleOpen} gameCode={gameCode} />
            ))}
        </div>
    );
};

export default DataTable;
