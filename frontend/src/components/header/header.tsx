import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import { useGameStore } from '../../storage/gameStore';
import styles from './header.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from "../../storage/userStore";

const api = process.env.REACT_APP_API;

export default function Header() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [loading, setLoading] = useState(false);
    const { gameCode, setGameCode, setData } = useGameStore();
    const { user, logout, login } = useUserStore();
    const navigate = useNavigate();

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleGameChange = (event: SelectChangeEvent<number>) => {
        setGameCode(parseInt(event.target.value as string, 10));
    };

    const handleRecalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://${api}:3008/api/recalculate-coefficients/${gameCode}`);
            const result = await response.json();
            if (result.length > 0) {
                setData(result);
            }
        } catch (error) {
            console.error('Error recalculating coefficients:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleMenuItemClick = () => {
        logout();
        setAnchorEl(null);
    };


    const handleLoginClick = () => {
        const mockUser = {
            username: 'mockUser',
            password: 'mockPassword',
            role: 'admin',
        };

        login(mockUser.username);
    };

    return (
        <Box className={styles.header}>
            <AppBar position="static" sx={{ backgroundColor: 'black', width: '100%' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Select
                        value={gameCode}
                        onChange={handleGameChange}
                        className={styles.gameSelect}
                        sx={{
                            borderRadius: 3,
                            width: 'auto',
                            background: 'linear-gradient(45deg, #2F4F4F 20%, #8B0000 90%)',
                            border: 0,
                            boxShadow: '0 3px 5px 2px rgba(47, 79, 79, .3)',
                            color: '#FFE4E1',
                            height: 48,
                            padding: '0 20px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <MenuItem value={730}>Counter-Strike 2</MenuItem>
                        <MenuItem value={570}>Dota 2</MenuItem>
                        <MenuItem value={578080}>PUBG</MenuItem>
                    </Select>
                    <Button
                        onClick={handleRecalculate}
                        disabled={loading}
                        className={styles.recalculateButton}
                        sx={{
                            background: 'linear-gradient(45deg, #2F4F4F 20%, #8B0000 90%)',
                            border: 0,
                            borderRadius: 3,
                            boxShadow: '0 3px 5px 2px rgba(47, 79, 79, .3)',
                            color: '#FFE4E1',
                            height: 48,
                            padding: '0 20px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:disabled': {
                                background: 'linear-gradient(45deg, #2F4F4F 20%, #8B0000 90%)',
                                opacity: 0.5,
                            }
                        }}
                    >
                        {loading ? 'Ожидайте' : 'Пересчитать'}
                    </Button>
                    <Link to="/" className={styles.link}>
                        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '2.5rem', color: 'darkred' }}>
                            ASystems
                        </Typography>
                        <Button
                            // onClick={handleRecalculate}
                            className={styles.recalculateButton}
                            sx={{
                                background: 'linear-gradient(45deg, #2F4F4F 20%, #8B0000 90%)',
                                border: 0,
                                borderRadius: 3,
                                boxShadow: '0 3px 5px 2px rgba(47, 79, 79, .3)',
                                color: '#FFE4E1',
                                height: 48,
                                padding: '0 20px',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:disabled': {
                                    background: 'linear-gradient(45deg, #2F4F4F 20%, #8B0000 90%)',
                                    opacity: 0.5,
                                }
                            }}
                        >
                            Фильтры
                        </Button>
                    </Link>
                    {user ? (
                        <Box className={styles.MenuButton}>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenuClick}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem
                                    onClick={() => {
                                        navigate('/');
                                        handleClose();
                                    }}
                                >
                                    Личный кабинет
                                </MenuItem>
                                <MenuItem onClick={handleMenuItemClick}>Выйти</MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Box className={styles.MenuButton}>
                            <Button
                                className={styles.LoggedInButton}
                                color="inherit"
                                onClick={handleLoginClick}
                            >
                                Login
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
}
