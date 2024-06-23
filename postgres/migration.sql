CREATE INDEX IF NOT EXISTS idx_item_orders_item_id ON item_orders (item_id);
CREATE INDEX IF NOT EXISTS idx_item_orders_date ON item_orders (date);
CREATE INDEX IF NOT EXISTS idx_item_orders_price ON item_orders (price);
CREATE INDEX IF NOT EXISTS idx_item_orders_order_type ON item_orders (order_type);

CREATE INDEX IF NOT EXISTS idx_price_history_item_id ON price_history (item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history (date);

CREATE INDEX IF NOT EXISTS idx_steam_items_appid ON steam_items (appid);
