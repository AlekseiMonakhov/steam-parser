import React, { useState, useEffect } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';

interface Item {
    market_name: string;
    dailyLiquidity: string;
    avgMonthlyPrice: number;
    volatility: number;
    attractiveness: number;
    PZCoefficient: number;
}

export default function MainPage() {
    const [data, setData] = useState<Item[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetch('http://localhost:3008/api/coefficients/730')
            .then(response => response.json())
            .then(data => setData(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className={styles.MainPage}>
            <header className={styles.MainPageHeader}>
                <h1 className={styles.title}>Аналитика</h1>
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
                            <div>{item.dailyLiquidity}</div>
                            <div>{Number(item.avgMonthlyPrice).toFixed(3)}</div>
                            <div>{Number(item.volatility).toFixed(3)}</div>
                            <div>{Number(item.attractiveness).toFixed(3)}</div>
                            <div>{Number(item.PZCoefficient).toFixed(3)}</div>
                        </div>
                    ))}
                </div>
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
