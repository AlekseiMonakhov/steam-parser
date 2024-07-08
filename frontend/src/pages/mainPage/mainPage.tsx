import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './mainPage.module.css';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Chart from '../../components/chart/chart';
import { useGameStore } from '../../storage/gameStore';
import usePagination from '../../hooks/usePagination';
import DataTable from "../../components/dataTable/dataTable";
import { Item, PZCoefficient } from '../../types/itemTypes';
import FilterModal from '../../components/filterModal/filterModal';
import { useFiltersStore } from '../../storage/filterStore';

const api = process.env.REACT_APP_API;

export default function MainPage() {
    const { data, loading, setData, setLoading, gameCode } = useGameStore();
    const [open, setOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedPZ, setSelectedPZ] = useState<PZCoefficient[]>([]);
    const [selectedItemName, setSelectedItemName] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
    const { filters } = useFiltersStore();
    const { currentPage, handlePageChange, itemsPerPage, setCurrentPage } = usePagination(9);

    const fetchData = useCallback(async (gameCode: number) => {
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
    }, [setData, setLoading]);

    useEffect(() => {
        fetchData(gameCode);
    }, [gameCode, fetchData]);

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
        }
        setSortConfig({ key, direction });
    };

    const applyFilters = useCallback((data: Item[], filters: { rarity: string[], quality: string[], itemgroup: string[] }) => {
        return data.filter(item => {
            const rarityMatch = filters.rarity.length === 0 || filters.rarity.includes(item.rarity || '');
            const qualityMatch = filters.quality.length === 0 || filters.quality.includes(item.quality || '');
            const itemGroupMatch = filters.itemgroup.length === 0 || filters.itemgroup.includes(item.itemgroup || '');
            return rarityMatch && qualityMatch && itemGroupMatch;
        });
    }, []);

    const filteredData = useMemo(() => applyFilters(data, filters), [data, filters, applyFilters]);

    const sortedData = useMemo(() => {
        let sortableData = [...filteredData];
        if (sortConfig.key) {
            sortableData.sort((a, b) => {
                const aValue = parseFloat(a[sortConfig.key as keyof Item] as string) || 0;
                const bValue = parseFloat(b[sortConfig.key as keyof Item] as string) || 0;
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
    }, [filteredData, sortConfig]);

    const currentData = useMemo(() => {
        return sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const handleApplyFilters = useCallback((newFilters: { rarity: string[], quality: string[], itemgroup: string[] }) => {
        setFilterOpen(false);
        setCurrentPage(1);
    }, [setCurrentPage]);

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
                    count={Math.ceil(sortedData.length / itemsPerPage)}
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
            <FilterModal 
                open={filterOpen} 
                onClose={() => setFilterOpen(false)} 
                onApplyFilters={handleApplyFilters} 
                currentFilters={filters}
            />
        </div>
    );
}