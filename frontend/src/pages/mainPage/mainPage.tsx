import React, { useState, useEffect, useMemo } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Chart from '../../components/chart/chart';
import { Item, PZCoefficient } from "./types";
import { useGameStore } from '../../storage/gameStore';
import usePagination from '../../hooks/usePagination';
import DataTable from "../../components/dataTable/dataTable";

const api = process.env.REACT_APP_API;

export default function MainPage() {
    const { data, loading, setData, setLoading, gameCode } = useGameStore();
    const [open, setOpen] = useState(false);
    const [selectedPZ, setSelectedPZ] = useState<PZCoefficient[]>([]);
    const [selectedItemName, setSelectedItemName] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
    const { currentPage, handlePageChange, itemsPerPage } = usePagination(9);

    const fetchData = async (gameCode: number) => {
          try {
            const response = await fetch(`http://${api}:3008/api/coefficients/${gameCode}`);
            const result = await response.json();
            if (result.length > 0) {
                setData(result);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(gameCode);
    }, [gameCode]);

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

    const getValueByKey = (item: Item, key: string): unknown => {
        return key.split('.').reduce((acc: any, part: string) => acc && acc[part], item);
    };

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig.key) {
            sortableData.sort((a, b) => {
                const aValue = parseFloat(getValueByKey(a, sortConfig.key) as string) || 0;
                const bValue = parseFloat(getValueByKey(b, sortConfig.key) as string) || 0;
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

    const currentData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className={styles.MainPage}>
            <header className={styles.MainPageHeader}>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <DataTable
                        data={currentData}
                        sortConfig={sortConfig}
                        handleSort={handleSort}
                        handleOpen={handleOpen}
                        gameCode={gameCode}
                    />
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
