const pool = require('../database/db');

const getDailyLiquidity = async (item_id) => {
  const query = `
    SELECT COUNT(*) / 30 AS daily_liquidity
    FROM price_history
    WHERE date >= NOW() - INTERVAL '30 days'
      AND item_id = $1
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.daily_liquidity || 0;
};

const getAverageDailyPrice = async (item_id) => {
  const query = `
    WITH hourly_data AS (
      SELECT date_trunc('hour', date) AS hour, SUM(price * volume) AS total_value, SUM(volume) AS total_volume
      FROM price_history
      WHERE date >= NOW() - INTERVAL '1 day'
        AND item_id = $1
      GROUP BY hour
    )
    SELECT AVG(total_value / total_volume) AS average_daily_price
    FROM hourly_data
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.average_daily_price || 0;
};

const getAverageMonthlyPrice = async (item_id) => {
  const query = `
    WITH daily_prices AS (
      SELECT date_trunc('day', date) AS day, SUM(price * volume) / SUM(volume) AS daily_price
      FROM price_history
      WHERE date >= NOW() - INTERVAL '30 days'
        AND item_id = $1
      GROUP BY day
    )
    SELECT AVG(daily_price) AS average_monthly_price
    FROM daily_prices
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.average_monthly_price || 0;
};

const getVolatility = async (item_id) => {
  const query = `
    WITH daily_prices AS (
      SELECT date_trunc('day', date) AS day, SUM(price * volume) / SUM(volume) AS daily_price
      FROM price_history
      WHERE date >= NOW() - INTERVAL '30 days'
        AND item_id = $1
      GROUP BY day
    )
    SELECT MAX(daily_price) / MIN(daily_price) AS volatility
    FROM daily_prices
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.volatility || 0;
};

const getAttractiveness = async (item_id, avg_monthly_price) => {
  const query = `
    WITH buy_prices AS (
      SELECT SUM(price * quantity) / SUM(quantity) AS buy_price
      FROM item_orders
      WHERE order_type = 'buy'
        AND price > $1
        AND item_id = $2
    ),
    sell_prices AS (
      SELECT SUM(price * quantity) / SUM(quantity) AS sell_price
      FROM item_orders
      WHERE order_type = 'sell'
        AND price < $1
        AND item_id = $2
    )
    SELECT (sell_prices.sell_price * 0.87) / buy_prices.buy_price AS attractiveness
    FROM buy_prices, sell_prices
  `;
  const result = await pool.query(query, [avg_monthly_price, item_id]);
  return result.rows[0]?.attractiveness || 0;
};

const calculateCoefficients = async (appid) => {
  const itemsQuery = `
    SELECT id, market_name
    FROM steam_items
    WHERE appid = $1
  `;
  const itemsResult = await pool.query(itemsQuery, [appid]);
  const items = itemsResult.rows;

  const coefficients = [];

  for (const item of items) {
    const dailyLiquidity = await getDailyLiquidity(item.id);
    const avgDailyPrice = await getAverageDailyPrice(item.id);
    const avgMonthlyPrice = await getAverageMonthlyPrice(item.id);
    const volatility = await getVolatility(item.id);
    const attractiveness = await getAttractiveness(item.id, avgMonthlyPrice);

    coefficients.push({
      market_name: item.market_name,
      dailyLiquidity,
      avgMonthlyPrice,
      volatility,
      attractiveness
    });
  }

  return coefficients;
};

module.exports = {
  calculateCoefficients,
};
