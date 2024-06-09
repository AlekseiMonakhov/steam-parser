const pool = require('../database/db');

const getDailyLiquidity = async (item_id) => {
  const query = `
    SELECT SUM(volume) / 30 AS daily_liquidity
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

const getAveragePurchaseValue = async (item_id, avg_monthly_price) => {
  const query = `
    SELECT SUM(price * volume) / SUM(volume) AS average_purchase_value
    FROM price_history
    WHERE price > $1
      AND item_id = $2
  `;
  const result = await pool.query(query, [avg_monthly_price, item_id]);
  return result.rows[0]?.average_purchase_value || 0;
};

const getAverageSellValue = async (item_id, avg_monthly_price) => {
  const query = `
    SELECT SUM(price * volume) / SUM(volume) AS average_sell_value
    FROM price_history
    WHERE price < $1
      AND item_id = $2
  `;
  const result = await pool.query(query, [avg_monthly_price, item_id]);
  return result.rows[0]?.average_sell_value || 0;
};

const getAverageMonthlyPurchaseValue = (avg_purchase_value) => {
  return avg_purchase_value / 30;
};

const getAverageMonthlySellValue = (avg_sell_value) => {
  return avg_sell_value / 30;
};

const getAttractiveness = (avg_monthly_sell_value, avg_monthly_purchase_value) => {
  if (avg_monthly_purchase_value === 0) {
    return 0;
  }
  return (avg_monthly_sell_value * 0.87) / avg_monthly_purchase_value;
};

const getPZCoefficient = async (item_id, avg_monthly_price, daily_liquidity) => {
  if (avg_monthly_price === 0 || daily_liquidity === 0) {
    return 0; // Избегаем деления на ноль, возвращаем 0
  }

  const query = `
    WITH request_data AS (
      SELECT price, SUM(quantity) AS total_quantity
      FROM item_orders
      WHERE order_type = 'buy'
        AND price >= $1 * 0.5
        AND item_id = $2
      GROUP BY price
    ),
    cumulative_requests AS (
      SELECT price, 
             SUM(total_quantity) OVER (ORDER BY price) AS cumulative_quantity
      FROM request_data
    ),
    liquidity_data AS (
      SELECT price, cumulative_quantity / NULLIF($3, 0) AS liquidity
      FROM cumulative_requests
    ),
    margin_data AS (
      SELECT price, price * 0.87 / NULLIF($1, 0) AS margin1
      FROM request_data
    ),
    pz_data AS (
      SELECT liquidity_data.price,
             liquidity_data.liquidity AS liquidity,
             margin_data.margin1 - 1 AS margin2,
             CASE
               WHEN (margin_data.margin1 - 1) = 0 THEN 0
               ELSE liquidity_data.liquidity / NULLIF((margin_data.margin1 - 1), 0)
             END AS PZ
      FROM liquidity_data
      JOIN margin_data ON liquidity_data.price = margin_data.price
    )
    SELECT PZ
    FROM pz_data
    WHERE PZ IS NOT NULL -- исключаем нулевые значения
    ORDER BY PZ DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [avg_monthly_price, item_id, daily_liquidity]);
    console.log('Query result:', result.rows);
    if (result.rows.length === 0) {
      return 0; // возвращаем 0 если нет данных
    }
    return result.rows[0]?.pz || 0; // возвращаем вычисленное значение коэффициента ПЗ
  } catch (error) {
    console.error('Error executing query:', error);
    return 0;
  }
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
    const avgPurchaseValue = await getAveragePurchaseValue(item.id, avgMonthlyPrice);
    const avgSellValue = await getAverageSellValue(item.id, avgMonthlyPrice);
    const avgMonthlyPurchaseValue = getAverageMonthlyPurchaseValue(avgPurchaseValue);
    const avgMonthlySellValue = getAverageMonthlySellValue(avgSellValue);
    const attractiveness = getAttractiveness(avgMonthlySellValue, avgMonthlyPurchaseValue);
    const PZCoefficient = await getPZCoefficient(item.id, avgMonthlyPrice, dailyLiquidity);

    if (
      avgMonthlyPrice === 0 || volatility === 0 || PZCoefficient === 0
    ) {
      continue; 
    }

    coefficients.push({
      market_name: item.market_name,
      dailyLiquidity,
      avgMonthlyPrice,
      volatility,
      avgPurchaseValue,
      avgSellValue,
      avgMonthlyPurchaseValue,
      avgMonthlySellValue,
      attractiveness,
      PZCoefficient
    });
  }

  return coefficients;
};

module.exports = {
  calculateCoefficients,
};
