import React, { useState, useEffect } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';

interface Item {
    market_name: string;
    dailyLiquidity: string;
    avgMonthlyPrice: number;
    volatility: number;
    attractiveness: number;
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
                        <div>Предмет</div>
                        <div>К1</div>
                        <div>К2</div>
                        <div>К3</div>
                        <div>К4</div>
                        <div>К5</div>
                    </div>
                    {currentData.map((item, index) => (
                        <div key={index} className={styles.tableRow}>
                            <div className={styles.marketName}>{item.market_name}</div>
                            <div>{item.dailyLiquidity}</div>
                            <div>{item.avgMonthlyPrice}</div>
                            <div>{item.volatility}</div>
                            <div>{item.attractiveness}</div>
                            <div>-</div>
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
