import React from 'react';
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
}

const renderCheckboxes = (options: string[]) => {
    const columns = [];
    for (let i = 0; i < options.length; i += 15) {
        columns.push(
            <FormGroup key={i} className={styles.checkboxColumn}>
                {options.slice(i, i + 10).map((option) => (
                    <FormControlLabel
                        key={option}
                        control={<Checkbox name={option} />}
                        label={option}
                    />
                ))}
            </FormGroup>
        );
    }
    return columns;
};

const FilterModal: React.FC<FilterModalProps> = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box className={styles.modalContent}>
                <h2>Фильтры</h2>
                <div className={styles.filterContainer}>
                <FormControl component="fieldset" className={styles.filterBlock}>
                        <h3>Тип предмета</h3>
                        <div className={styles.checkboxContainer}>
                            {renderCheckboxes(itemGroupOptions)}
                        </div>
                    </FormControl>
                    <FormControl component="fieldset" className={styles.filterBlock}>
                        <h3>Rarity</h3>
                        <div className={styles.checkboxContainer}>
                            {renderCheckboxes(rarityOptions)}
                        </div>
                    </FormControl>
                    <FormControl component="fieldset" className={styles.filterBlock}>
                        <h3>Quality</h3>
                        <div className={styles.checkboxContainer}>
                            {renderCheckboxes(qualityOptions)}
                        </div>
                    </FormControl>
                    
                </div>
                <Button onClick={onClose} variant="contained" color="primary" className={styles.applyButton}>
                    Применить
                </Button>
            </Box>
        </Modal>
    );
};

export default FilterModal;