import React, { useState, useEffect } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import ChartIcon from '@mui/icons-material/BarChart';
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

    const currentData = data.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

    return (
        <div className={styles.MainPage}>
            <header className={styles.MainPageHeader}>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <div className={styles.tableContainer}>
                        <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                            <div>Предмет</div>
                            <div>Л</div>
                            <div>СР</div>
                            <div>СРН</div>
                            <div>В</div>
                            <div>П</div>
                            <div>ПЗ</div>
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
                                <div>{Number(item.coefficientPZ.coefficientPZ).toFixed(10)} | {Number(item.coefficientPZ.price).toFixed(3)}</div>
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
