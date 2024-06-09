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
    SELECT AVG(daily_price) AS coefficientSR
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
  if (coefficientS3 === 0) {
    return 0;
  }
  return (coefficientS4 * 0.87) / coefficientS3;
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
    const coefficientPZ = '-';

    coefficients.push({
      market_name: item.market_name,
      coefficientL,
      coefficientSR,
      coefficientV,
      coefficientP,
      coefficientPZ,
    });
  }

  return coefficients;
};

module.exports = {
  calculateCoefficients,
};
