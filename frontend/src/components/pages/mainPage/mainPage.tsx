import React, { useState, useEffect } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';

interface Item {
    name: string;
    K1: number;
    K2: number;
    K3: number;
    K4: number;
    K5: number;
    K6: number;
}

const mockData: Item[] = [
    { name: 'Item 1', K1: 1.1, K2: 2.2, K3: 3.3, K4: 4.4, K5: 5.5, K6: 6.6 },
    { name: 'Item 2', K1: 1.2, K2: 2.3, K3: 3.4, K4: 4.5, K5: 5.6, K6: 6.7 },
    { name: 'Item 3', K1: 1.3, K2: 2.4, K3: 3.5, K4: 4.6, K5: 5.7, K6: 6.8 },
    { name: 'Item 4', K1: 1.4, K2: 2.5, K3: 3.6, K4: 4.7, K5: 5.8, K6: 6.9 },
    { name: 'Item 5', K1: 1.5, K2: 2.6, K3: 3.7, K4: 4.8, K5: 5.9, K6: 7.0 },
    { name: 'Item 6', K1: 1.6, K2: 2.7, K3: 3.8, K4: 4.9, K5: 6.0, K6: 7.1 },
    { name: 'Item 7', K1: 1.7, K2: 2.8, K3: 3.9, K4: 5.0, K5: 6.1, K6: 7.2 },
    { name: 'Item 8', K1: 1.8, K2: 2.9, K3: 4.0, K4: 5.1, K5: 6.2, K6: 7.3 },
    { name: 'Item 9', K1: 1.9, K2: 3.0, K3: 4.1, K4: 5.2, K5: 6.3, K6: 7.4 },
    { name: 'Item 10', K1: 2.0, K2: 3.1, K3: 4.2, K4: 5.3, K5: 6.4, K6: 7.5 },
    { name: 'Item 11', K1: 2.1, K2: 3.2, K3: 4.3, K4: 5.4, K5: 6.5, K6: 7.6 },
    { name: 'Item 12', K1: 2.2, K2: 3.3, K3: 4.4, K4: 5.5, K5: 6.6, K6: 7.7 },
];

export default function MainPage() {
    const [data, setData] = useState<Item[]>(mockData);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        // Здесь будет вызов настоящего API
        // fetch(mockApiUrl)
        //   .then(response => response.json())
        //   .then(data => setData(data))
        //   .catch(error => console.error('Error fetching data:', error));
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
                    <div className={styles.tableHeader}>
                        <div>Предмет</div>
                        <div>К1</div>
                        <div>К2</div>
                        <div>К3</div>
                        <div>К4</div>
                        <div>К5</div>
                        <div>К6</div>
                    </div>
                    {currentData.map((item, index) => (
                        <div key={index} className={styles.tableRow}>
                            <div>{item.name}</div>
                            <div>{item.K1}</div>
                            <div>{item.K2}</div>
                            <div>{item.K3}</div>
                            <div>{item.K4}</div>
                            <div>{item.K5}</div>
                            <div>{item.K6}</div>
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
