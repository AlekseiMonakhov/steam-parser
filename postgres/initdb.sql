DO $$ BEGIN RAISE NOTICE 'Starting initialization'; END $$;

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  hash_password VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE,
  verified BOOL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS steam_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  hash_name VARCHAR(255) UNIQUE,
  sell_listings INTEGER,
  sell_price INTEGER,
  sell_price_text VARCHAR(50),
  app_icon VARCHAR(255),
  app_name VARCHAR(255),
  tradable BOOLEAN,
  market_name VARCHAR(255),
  market_hash_name VARCHAR(255),
  commodity BOOLEAN,
  market_tradable_restriction INTEGER,
  market_marketable_restriction INTEGER,
  marketable BOOLEAN,
  type VARCHAR(50),
  background_color VARCHAR(50),
  icon_url VARCHAR(255),
  icon_url_large VARCHAR(255)
);
