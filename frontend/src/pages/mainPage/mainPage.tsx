import React, { useState, useEffect } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';

interface PZCoefficient {
    price: string;
    coefficientPZ: number;
}

interface Item {
    market_name: string;
    coefficientL: number;
    coefficientSR: number;
    coefficientV: number;
    coefficientP: number;
    coefficientPZ: PZCoefficient[];
}

export default function MainPage() {
    const [data, setData] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = () => {
        fetch('http://localhost:3008/api/coefficients/730')
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
        fetchData();
    }, []);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className={styles.MainPage}>
            <header className={styles.MainPageHeader}>
                <h1 className={styles.title}>Аналитика</h1>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <div className={styles.tableContainer}>
                        <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                            <div>Item</div>
                            <div>Л</div>
                            <div>СР</div>
                            <div>В</div>
                            <div>П</div>
                            <div>ПЗ</div>
                        </div>
                        {currentData.map((item, index) => (
                            <div key={index} className={styles.tableRow}>
                                <div className={styles.marketName}>{item.market_name}</div>
                                <div>{item.coefficientL}</div>
                                <div>{Number(item.coefficientSR).toFixed(3)}</div>
                                <div>{Number(item.coefficientV).toFixed(3)}</div>
                                <div>{Number(item.coefficientP).toFixed(3)}</div>
                                <div>
                                    {item.coefficientPZ.map(pz => `[${pz.price}, ${pz.coefficientPZ}]`).join(', ')}
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
        </div>
    );
}
