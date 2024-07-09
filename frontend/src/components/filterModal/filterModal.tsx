import React, { useState, useEffect } from 'react';
import { Modal, Box, FormControl, FormGroup, FormControlLabel, Checkbox, Button } from '@mui/material';
import styles from './filterModal.module.css';
import { useFiltersStore } from '../../storage/filterStore'; 
import { useGameStore } from '../../storage/gameStore';

const rarityOptions730 = [
    'master', 'restricted', 'high grade', 'mil-spec grade', 
    'classified', 'covert',
    'superior', 'base grade', 'industrial grade', 
    'exotic', 'distinguished', 'extraordinary', 
    'exceptional', 'consumer grade', 'remarkable'
];

const qualityOptions730 = [
    'normal', 'strange', 'unusual'
];

const itemGroupOptions730 = [
    'agent', 'music kit', 'rifle', 'shotgun', 'patch', 'sniper rifle', 'smg',
    'pistol', 'container', 'machinegun',
    'sticker', 'equipment', 'gloves', 'knife'
];

const rarityOptions570 = [
    'rare', 'common', 'immortal', 'mythical', 'arcana', 
    'legendary', 'uncommon'
];

const qualityOptions570 = [
    'unique', 'strange', 'genuine', 'exalted'
];

const itemGroupOptions570 = [
    'taunt', 'loading screen', 'wearable', 'bundle', 
    'dire towers', 'gem / rune', 'treasure', 
    'radiant towers', 'player card'
];

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    onApplyFilters: (filters: { rarity: string[], quality: string[], itemgroup: string[] }) => void;
    currentFilters: { rarity: string[], quality: string[], itemgroup: string[] };
}

const FilterModal: React.FC<FilterModalProps> = ({ open, onClose, onApplyFilters }) => {
    const { filters, setFilters, clearFilters } = useFiltersStore();
    const { gameCode } = useGameStore();
    const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
    const [selectedQuality, setSelectedQuality] = useState<string[]>([]);
    const [selectedItemGroup, setSelectedItemGroup] = useState<string[]>([]);

    const rarityOptions = gameCode === 730 ? rarityOptions730 : gameCode === 570 ? rarityOptions570 : [];
    const qualityOptions = gameCode === 730 ? qualityOptions730 : gameCode === 570 ? qualityOptions570 : [];
    const itemGroupOptions = gameCode === 730 ? itemGroupOptions730 : gameCode === 570 ? itemGroupOptions570 : [];

    const handleCheckboxChange = (option: string, setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
        setSelected((prev) => 
            prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
        );
    };

    const handleApplyFilters = () => {
        const newFilters = {
            rarity: selectedRarity,
            quality: selectedQuality,
            itemgroup: selectedItemGroup,
        };
        setFilters(newFilters);
        onApplyFilters(newFilters);
    };

    useEffect(() => {
        if (open) {
            setSelectedRarity(filters.rarity);
            setSelectedQuality(filters.quality);
            setSelectedItemGroup(filters.itemgroup);
        }
    }, [open, filters]);

    useEffect(() => {
        clearFilters();
        setSelectedRarity([]);
        setSelectedQuality([]);
        setSelectedItemGroup([]);
    }, [gameCode, clearFilters]);

    if (gameCode !== 730 && gameCode !== 570) {
        return null;
    }

    return (
        <Modal open={open} onClose={onClose}>
            <Box className={styles.modalContent}>
                <h2>Фильтры</h2>
                <div className={styles.filterContainer}>
                    <FormControl component="fieldset" className={styles.filterBlock}>
                        <h3>Тип предмета</h3>
                        <div className={styles.checkboxContainer}>
                            {itemGroupOptions.map((option) => (
                                <FormControlLabel
                                    key={option}
                                    control={
                                        <Checkbox
                                            checked={selectedItemGroup.includes(option)}
                                            onChange={() => handleCheckboxChange(option, setSelectedItemGroup)}
                                        />
                                    }
                                    label={option}
                                />
                            ))}
                        </div>
                    </FormControl>
                    <FormControl component="fieldset" className={styles.filterBlock}>
                        <h3>Редкость</h3>
                        <div className={styles.checkboxContainer}>
                            {rarityOptions.map((option) => (
                                <FormControlLabel
                                    key={option}
                                    control={
                                        <Checkbox
                                            checked={selectedRarity.includes(option)}
                                            onChange={() => handleCheckboxChange(option, setSelectedRarity)}
                                        />
                                    }
                                    label={option}
                                />
                            ))}
                        </div>
                    </FormControl>
                    <FormControl component="fieldset" className={styles.filterBlock}>
                        <h3>Качество</h3>
                        <div className={styles.checkboxContainer}>
                            {qualityOptions.map((option) => (
                                <FormControlLabel
                                    key={option}
                                    control={
                                        <Checkbox
                                            checked={selectedQuality.includes(option)}
                                            onChange={() => handleCheckboxChange(option, setSelectedQuality)}
                                        />
                                    }
                                    label={option}
                                />
                            ))}
                        </div>
                    </FormControl>
                </div>
                <Button onClick={handleApplyFilters} variant="contained" color="primary" className={styles.applyButton}>
                    Применить
                </Button>
            </Box>
        </Modal>
    );
};

export default FilterModal;