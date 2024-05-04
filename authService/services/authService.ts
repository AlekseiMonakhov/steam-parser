import bcrypt from 'bcrypt';
import pool from '../db/postgresConfig';

class AuthService {
  async signUp(username: string, password: string, email: string): Promise<object> {
    if (!password) {
      throw new Error("Пароль не предоставлен");
  }
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO users.users (username, hash_password, email, created_at, updated_at, verified) VALUES ($1, $2, $3, NOW(), NOW(), FALSE) RETURNING user_id',
        [username, hashedPassword, email]
      );
      return { message: 'Пользователь зарегистрирован', userId: result.rows[0].user_id };
    } finally {
      client.release();
    }
  }

  async login(email: string, password: string): Promise<object> {
    const client = await pool.connect();
    try {
      const user = await client.query(
        'SELECT user_id, hash_password FROM users.users WHERE email = $1',
        [email]
      );
      if (user.rows.length === 0) {
        throw new Error('Пользователь не найден');
      }
      const isValid = await bcrypt.compare(password, user.rows[0].hash_password);
      if (!isValid) {
        throw new Error('Неверные учетные данные');
      }
      return { message: 'Успешный вход в систему', userId: user.rows[0].user_id };
    } finally {
      client.release();
    }
  }
}

export default AuthService;
