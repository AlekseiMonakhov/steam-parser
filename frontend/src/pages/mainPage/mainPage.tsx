import React, { useState, useEffect } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import ChartIcon from '@mui/icons-material/BarChart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Chart from '../../components/chart/chart';
import { Item, PZCoefficient } from "./types";
import { useGameStore } from '../../storage/gameStore';

export default function MainPage() {
    const [data, setData] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [open, setOpen] = useState(false);
    const [selectedPZ, setSelectedPZ] = useState<PZCoefficient[]>([]);
    const [selectedItemName, setSelectedItemName] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
    const itemsPerPage = 9;
    const { gameCode } = useGameStore();

    const fetchData = (gameCode: number) => {
        setLoading(true);
        fetch(`http://localhost:3008/api/coefficients/${gameCode}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    setData(data);
                    setLoading(false);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };

    useEffect(() => {
        fetchData(gameCode);
    }, [gameCode]);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const handleOpen = (pzData: PZCoefficient[], itemName: string) => {
        setSelectedPZ(pzData);
        setSelectedItemName(itemName);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        } else {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        let sortableData = [...data];
        if (sortConfig.key) {
            sortableData.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key.includes('.')) {
                    const keys = sortConfig.key.split('.');
                    // @ts-ignore
                    aValue = parseFloat(a[keys[0]][keys[1]]) || 0;
                    // @ts-ignore
                    bValue = parseFloat(b[keys[0]][keys[1]]) || 0;
                } else {
                    // @ts-ignore
                    aValue = parseFloat(a[sortConfig.key]) || 0;
                    // @ts-ignore
                    bValue = parseFloat(b[sortConfig.key]) || 0;
                }
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

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
        <div className={styles.MainPage}>
            <header className={styles.MainPageHeader}>
                {loading ? (
                    <CircularProgress />
                ) : (
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
                        {currentData.map((item, index) => (
                            <div key={index} className={styles.tableRow}>
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
                        ))}
                    </div>
                )}
                <Pagination
                    count={Math.ceil(data.length / itemsPerPage)}
                    page={currentPage}
                    onChange={handlePageChange}
                    className={styles.pagination}
                />
            </header>
            <Modal open={open} onClose={handleClose}>
                <div className={styles.modalContent}>
                    <Chart data={selectedPZ} itemName={selectedItemName} />
                </div>
            </Modal>
        </div>
    );
}
