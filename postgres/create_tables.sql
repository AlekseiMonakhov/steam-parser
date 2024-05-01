CREATE ROLE test_role WITH LOGIN PASSWORD 'test_password' SUPERUSER;

ALTER ROLE test_user SET ROLE test_role;

CREATE SCHEMA IF NOT EXISTS users;

GRANT USAGE ON SCHEMA users TO test_role;

CREATE TABLE IF NOT EXISTS users.users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  hash_password VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at DATE,
  updated_at DATE,
  verified BOOL,
);

INSERT INTO users.users (username, hash_password, email, created_at, updated_at, verified)
VALUES 
  ('testUser1Client1', 'hash_password', 'testUser1@gmail.com', CURRENT_DATE, CURRENT_DATE, false),
  ('testUser2Client2', 'hash_password', 'testUser2@gmail.com', CURRENT_DATE, CURRENT_DATE, false),
  ('testUser3Provider1', 'hash_password', 'testUser3@gmail.com', CURRENT_DATE, CURRENT_DATE, false),
  ('testUser4Provider2', 'hash_password', 'testUser4@gmail.com', CURRENT_DATE, CURRENT_DATE, false);


