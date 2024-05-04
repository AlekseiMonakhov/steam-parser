DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mydb') THEN
        CREATE DATABASE mydb WITH OWNER test_user;
    END IF;
END
$$;

\c mydb 

CREATE SCHEMA IF NOT EXISTS users;

SET ROLE test_user;

CREATE TABLE IF NOT EXISTS users.users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  hash_password VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE,
  verified BOOL DEFAULT FALSE
);
