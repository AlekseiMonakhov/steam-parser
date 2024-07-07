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
    'taunt', 'loading screen', 'agent', 'wearable', 'rifle', 'music kit', 'collectible', 'bundle', 'sniper rifle', 'shotgun', 'behälter', 'dire towers', 'pistol', 'schlüssel', 'container', 'machinegun', 'gem / rune', 'treasure', 'radiant towers', 'sticker', 'equipment', 'gloves', 'knife', 'smg', 'sticker'
];

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ open, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box className={styles.modalContent}>
                <h2>Фильтры</h2>
                <FormControl component="fieldset">
                    <h3>Rarity</h3>
                    <FormGroup>
                        {rarityOptions.map((option) => (
                            <FormControlLabel
                                key={option}
                                control={<Checkbox name={option} />}
                                label={option}
                            />
                        ))}
                    </FormGroup>
                    <h3>Quality</h3>
                    <FormGroup>
                        {qualityOptions.map((option) => (
                            <FormControlLabel
                                key={option}
                                control={<Checkbox name={option} />}
                                label={option}
                            />
                        ))}
                    </FormGroup>
                    <h3>Тип предмета</h3>
                    <FormGroup>
                        {itemGroupOptions.map((option) => (
                            <FormControlLabel
                                key={option}
                                control={<Checkbox name={option} />}
                                label={option}
                            />
                        ))}
                    </FormGroup>
                </FormControl>
                <Button onClick={onClose} variant="contained" color="primary">
                    Применить
                </Button>
            </Box>
        </Modal>
    );
};

export default FilterModal;
