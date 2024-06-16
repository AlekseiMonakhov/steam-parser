const pool = require('../database/db');

const getCoefficientL = async (item_id) => {
  const query = `
    SELECT SUM(volume) / 30 AS coefficientL
    FROM price_history
    WHERE date >= NOW() - INTERVAL '30 days'
      AND item_id = $1
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.coefficientl;
};

const getCoefficientSR = async (item_id) => {
  const query = `
    WITH daily_prices AS (
      SELECT date_trunc('day', date) AS day, SUM(price * volume) / SUM(volume) AS daily_price
      FROM price_history
      WHERE date >= NOW() - INTERVAL '30 days'
        AND item_id = $1
      GROUP BY day
    )
    SELECT AVG(daily_price) * 0.87 AS coefficientSR
    FROM daily_prices
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.coefficientsr;
};

const getCoefficientV = async (item_id) => {
  const query = `
    WITH daily_prices AS (
      SELECT date_trunc('day', date) AS day, SUM(price * volume) / SUM(volume) AS daily_price
      FROM price_history
      WHERE date >= NOW() - INTERVAL '30 days'
        AND item_id = $1
      GROUP BY day
    )
    SELECT MAX(daily_price) / MIN(daily_price) AS coefficientV
    FROM daily_prices
  `;
  const result = await pool.query(query, [item_id]);
  return result.rows[0]?.coefficientv;
};

const getCoefficientS1 = async (item_id, coefficientSR) => {
  const query = `
    SELECT SUM(price * volume) / SUM(volume) AS coefficientS1
    FROM price_history
    WHERE price > $1
      AND item_id = $2
  `;
  const result = await pool.query(query, [coefficientSR, item_id]);
  return result.rows[0]?.coefficients1;
};

const getCoefficientS2 = async (item_id, coefficientSR) => {
  const query = `
    SELECT SUM(price * volume) / SUM(volume) AS coefficientS2
    FROM price_history
    WHERE price < $1
      AND item_id = $2
  `;
  const result = await pool.query(query, [coefficientSR, item_id]);
  return result.rows[0]?.coefficients2;
};

const getCoefficientS3 = (coefficientS1) => {
  return coefficientS1 / 30;
};

const getCoefficientS4 = (coefficientS2) => {
  return coefficientS2 / 30;
};

const getCoefficientP = (coefficientS4, coefficientS3) => {
  return (coefficientS4 * 0.87) / coefficientS3;
};

const getBuyOrders = async (item_id) => {
  let query = `
    SELECT price, quantity
    FROM item_orders
    WHERE item_id = $1
      AND order_type = 'buy'
      AND date = CURRENT_DATE
    ORDER BY price DESC
  `;
  let result = await pool.query(query, [item_id]);

  if (result.rows.length === 0) {
    query = `
      SELECT price, quantity
      FROM item_orders
      WHERE item_id = $1
        AND order_type = 'buy'
        AND date = CURRENT_DATE - INTERVAL '1 day'
      ORDER BY price DESC
    `;
    result = await pool.query(query, [item_id]);
  }

  return result.rows;
};

const calculatePZCoefficients = (buyOrders, coefficientL, coefficientSR) => {
  let cumulativeQuantity = 0;

  if (!buyOrders || buyOrders.length === 0 || !coefficientL || !coefficientSR) {
    return { topCoefficientPZ: { price: 0, coefficientPZ: 0 }, top20PZCoefficients: [] };
  }

  const results = buyOrders.map((order) => {
    cumulativeQuantity += order.quantity;
    const coefficientLZ = ( cumulativeQuantity / coefficientL ) + 1;
    const margin1 = coefficientSR / order.price;
    const margin2 = margin1 - 1;
    const coefficientPZ = margin2 / coefficientLZ;

    return {
      price: order.price,
      coefficientPZ,
    };
  });

  const topResults = results.sort((a, b) => b.coefficientPZ - a.coefficientPZ);
  const topCoefficientPZ = topResults[0];
  const top20PZCoefficients = topResults.slice(0, 20);

  return { topCoefficientPZ, top20PZCoefficients };
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
    const coefficientL = await getCoefficientL(item.id);
    const coefficientSR = await getCoefficientSR(item.id);
    const coefficientV = await getCoefficientV(item.id);
    const coefficientS1 = await getCoefficientS1(item.id, coefficientSR);
    const coefficientS2 = await getCoefficientS2(item.id, coefficientSR);
    const coefficientS3 = getCoefficientS3(coefficientS1);
    const coefficientS4 = getCoefficientS4(coefficientS2);
    const coefficientP = getCoefficientP(coefficientS4, coefficientS3);

    const buyOrders = await getBuyOrders(item.id);
    const { topCoefficientPZ, top20PZCoefficients } = calculatePZCoefficients(buyOrders, coefficientL, coefficientSR);

    coefficients.push({
      market_name: item.market_name,
      coefficientL,
      coefficientSR,
      coefficientV,
      coefficientP,
      coefficientPZ: topCoefficientPZ,
      top20PZCoefficients,
    });
  }

  return coefficients;
};

module.exports = {
  calculateCoefficients,
};
