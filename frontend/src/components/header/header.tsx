import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import styles from './header.module.css';
import { Button } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../storage/userStore';
import logo from './logo.svg'

export default function Header() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { user, logout, login } = useUserStore();
  const navigate = useNavigate();

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = () => {
    logout();
    setAnchorEl(null);
  };

  const handleClose = () => {
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
      <AppBar position="static" color="inherit" className={styles.AppBar}>
        <Toolbar>
          <Link to="/" className={styles.logoLink}>
            <img src={logo} alt="Logo" className={styles.logo} />
            <Typography variant="h6" className={styles.title}>
              SteamParser
            </Typography>
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
