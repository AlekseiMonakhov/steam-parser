import React, { useState, useEffect } from 'react';
import { Modal, Box, FormControl, FormGroup, FormControlLabel, Checkbox, Button } from '@mui/material';
import styles from './filterModal.module.css';

const rarityOptions = [
    'rare', 'common', 'master', 'immortal', 'restricted', 'high grade', 'remarkable', 'mythical', 'mil-spec grade', 'classified', 'standardqualität', 'arcana', 'legendary', 'covert', 'superior', 'base grade', 'industrial grade', 'exotic', 'distinguished', 'extraordinary', 'exceptional', 'consumer grade'
];

const qualityOptions = [
    'unique', 'normal', 'genuine', 'strange', 'exalted', 'unusual'
];

const itemGroupOptions = [
    'taunt', 'loading screen', 'agent', 'wearable', 'rifle', 'music kit', 'collectible', 'bundle', 'sniper rifle', 'shotgun', 'behälter', 'dire towers', 'pistol', 'schlüssel', 'container', 'machinegun', 'gem / rune', 'treasure', 'radiant towers', 'sticker', 'equipment', 'gloves', 'knife', 'smg'
];

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    onApplyFilters: (filters: { rarity: string[], quality: string[], itemgroup: string[] }) => void;
    currentFilters: { rarity: string[], quality: string[], itemgroup: string[] };
}

const FilterModal: React.FC<FilterModalProps> = ({ open, onClose, onApplyFilters, currentFilters }) => {
    const [selectedRarity, setSelectedRarity] = useState<string[]>(currentFilters.rarity);
    const [selectedQuality, setSelectedQuality] = useState<string[]>(currentFilters.quality);
    const [selectedItemGroup, setSelectedItemGroup] = useState<string[]>(currentFilters.itemgroup);

    const handleCheckboxChange = (option: string, setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
        setSelected((prev) => 
            prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
        );
    };

    const handleApplyFilters = () => {
        onApplyFilters({
            rarity: selectedRarity,
            quality: selectedQuality,
            itemgroup: selectedItemGroup,
        });
        onClose();
    };

    useEffect(() => {
        if (open) {
            setSelectedRarity(currentFilters.rarity);
            setSelectedQuality(currentFilters.quality);
            setSelectedItemGroup(currentFilters.itemgroup);
        }
    }, [open, currentFilters]);

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
                        <h3>Rarity</h3>
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
                        <h3>Quality</h3>
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