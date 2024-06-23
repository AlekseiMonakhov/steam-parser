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
  name VARCHAR(255) UNIQUE,
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
  icon_url VARCHAR(512),
  icon_url_large VARCHAR(512),
  item_nameid VARCHAR(255) NULL,
  appid INTEGER
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    price NUMERIC(10, 3) NOT NULL,
    volume INTEGER NOT NULL,
    CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES steam_items(id)
);

CREATE TABLE IF NOT EXISTS item_orders (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    order_type VARCHAR(50) NOT NULL,
    price NUMERIC(10, 3) NOT NULL,
    quantity INTEGER NOT NULL,
    date DATE,
    CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES steam_items(id)
);

CREATE INDEX IF NOT EXISTS idx_item_orders_item_id ON item_orders (item_id);
CREATE INDEX IF NOT EXISTS idx_item_orders_date ON item_orders (date);
CREATE INDEX IF NOT EXISTS idx_item_orders_price ON item_orders (price);
CREATE INDEX IF NOT EXISTS idx_item_orders_order_type ON item_orders (order_type);
CREATE INDEX IF NOT EXISTS idx_item_orders_item_id_date ON item_orders (item_id, date);

CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON price_history (item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history (date);

CREATE INDEX IF NOT EXISTS idx_steam_items_appid ON steam_items (appid);
CREATE INDEX IF NOT EXISTS idx_steam_items_item_nameid ON steam_items (item_nameid);
CREATE INDEX IF NOT EXISTS idx_steam_items_market_hash_name ON steam_items (market_hash_name);
