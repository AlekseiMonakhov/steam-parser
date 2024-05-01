import React, { useState } from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import styles from './registration.module.css';

export default function Registration() {
  const [role, setRole] = useState<string>('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
      role: role,
    });
  };

  return (
    <div className={styles.registrationContainer}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box className={styles.registrationElement}>
          <Typography component="h1" variant="h5">
            Регистрация
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} className={styles.registrationForm}>
            <TextField
              margin='dense'
              autoComplete="name"
              name="name"
              required
              fullWidth
              id="name"
              label="Логин"
              autoFocus
            />
            <TextField
              margin='dense'
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="new-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className={styles.registrationSubmitButton}
            >
              Зарегистрироваться
            </Button>
            <Link href="/login" 
            variant="body2"
            className={styles.loginLink}>
              Уже зарегистрированы? Войти
            </Link>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
