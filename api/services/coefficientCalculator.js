const pool = require('../database/db');
const client = require('../database/redisClient');

class CoefficientCalculator {
  constructor(appid) {
    this.appid = appid;
  }

  async get(key) {
    try {
      const result = await client.get(key);
      return result;
    } catch (err) {
      throw err;
    }
  }

  async set(key, value, expiration = 21600) {
    try {
      await client.set(key, value, { EX: expiration });
    } catch (err) {
      throw err;
    }
  }

  async queryWithCache(key, query, params = []) {
    const cachedResult = await this.get(key);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    const result = await pool.query(query, params);
    await this.set(key, JSON.stringify(result.rows));
    return result.rows;
  }

  async getCoefficientL(item_id) {
    const query = `
      SELECT SUM(volume) / 30 AS coefficientL
      FROM price_history
      WHERE date >= NOW() - INTERVAL '30 days'
        AND item_id = $1
    `;
    const result = await this.queryWithCache(`coefficientL:${item_id}`, query, [item_id]);
    return result[0]?.coefficientl;
  }

  async getCoefficientSR(item_id) {
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
    const result = await this.queryWithCache(`coefficientSR:${item_id}`, query, [item_id]);
    return result[0]?.coefficientsr;
  }

  async getCoefficientSRN(item_id) {
    const query = `
      WITH daily_prices AS (
        SELECT date_trunc('day', date) AS day, SUM(price * volume) / SUM(volume) AS daily_price
        FROM price_history
        WHERE date >= NOW() - INTERVAL '7 days'
          AND item_id = $1
        GROUP BY day
      )
      SELECT AVG(daily_price) * 0.87 AS coefficientSRN
      FROM daily_prices
    `;
    const result = await this.queryWithCache(`coefficientSRN:${item_id}`, query, [item_id]);
    return result[0]?.coefficientsrn;
  }

  async getCoefficientV(item_id) {
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
    const result = await this.queryWithCache(`coefficientV:${item_id}`, query, [item_id]);
    return result[0]?.coefficientv;
  }

  async getCoefficientS1(item_id, coefficientSR) {
    const query = `
      SELECT SUM(price * volume) / SUM(volume) AS coefficientS1
      FROM price_history
      WHERE price > $1
        AND item_id = $2
    `;
    const result = await this.queryWithCache(`coefficientS1:${item_id}:${coefficientSR}`, query, [coefficientSR, item_id]);
    return result[0]?.coefficients1;
  }

  async getCoefficientS2(item_id, coefficientSR) {
    const query = `
      SELECT SUM(price * volume) / SUM(volume) AS coefficientS2
      FROM price_history
      WHERE price < $1
        AND item_id = $2
    `;
    const result = await this.queryWithCache(`coefficientS2:${item_id}:${coefficientSR}`, query, [coefficientSR, item_id]);
    return result[0]?.coefficients2;
  }

  getCoefficientS3(coefficientS1) {
    return coefficientS1 / 30;
  }

  getCoefficientS4(coefficientS2) {
    return coefficientS2 / 30;
  }

  getCoefficientP(coefficientS4, coefficientS3) {
    return (coefficientS4 * 0.87) / coefficientS3;
  }

  async getBuyOrders(item_id, coefficientSR) {
    if (coefficientSR == null || coefficientSR === 0) {
      return [];
    }

    const query = `
    SELECT price, quantity
    FROM (
      SELECT price, quantity, date,
             MAX(date) OVER (PARTITION BY item_id) as max_date
      FROM item_orders
      WHERE item_id = $1
        AND order_type = 'buy'
        AND price >= $2
    ) AS subquery
    WHERE date = max_date
    ORDER BY price DESC
  `;

    const result = await pool.query(query, [item_id, coefficientSR * 0.5]);

    if (result.rows.length > 0) {
      return result.rows;
    }

    return [];
  }

  calculatePZCoefficients(buyOrders, coefficientL, coefficientSR) {
    if (!buyOrders || buyOrders.length === 0 || !coefficientL || !coefficientSR) {
      return { topCoefficientPZ: { price: 0, coefficientPZ: 0 }, top100PZCoefficients: [] };
    }

    const results = buyOrders.map((order) => {
      const coefficientLZ = (order.quantity / coefficientL) + 1;
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
    const top100PZCoefficients = topResults.slice(0, 100);

    return { topCoefficientPZ, top100PZCoefficients };
  }

  async calculateAndCacheCoefficients() {
    const itemsQuery = `
      SELECT id, market_name, rarity, quality, itemgroup
      FROM steam_items
      WHERE appid = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [this.appid]);
    const items = itemsResult.rows;

    const coefficientPromises = items.map(async (item) => {
      const [coefficientLResult, coefficientSRResult, coefficientSRNResult, coefficientVResult] = await Promise.all([
        this.getCoefficientL(item.id),
        this.getCoefficientSR(item.id),
        this.getCoefficientSRN(item.id),
        this.getCoefficientV(item.id),
      ]);

      const buyOrdersResult = await this.getBuyOrders(item.id, coefficientSRResult);

      const [coefficientS1, coefficientS2] = await Promise.all([
        this.getCoefficientS1(item.id, coefficientSRResult),
        this.getCoefficientS2(item.id, coefficientSRResult)
      ]);

      const coefficientS3 = this.getCoefficientS3(coefficientS1);
      const coefficientS4 = this.getCoefficientS4(coefficientS2);
      const coefficientP = this.getCoefficientP(coefficientS4, coefficientS3);
      const { topCoefficientPZ, top100PZCoefficients } = this.calculatePZCoefficients(buyOrdersResult, coefficientLResult, coefficientSRResult);

      return {
        market_name: item.market_name,
        coefficientL: coefficientLResult,
        coefficientSR: coefficientSRResult,
        coefficientSRN: coefficientSRNResult,
        coefficientV: coefficientVResult,
        coefficientP,
        coefficientPZ: topCoefficientPZ,
        top100PZCoefficients,
        rarity: item.rarity,
        quality: item.quality,
        itemgroup: item.itemgroup,
      };
    });

    const coefficients = (await Promise.all(coefficientPromises)).filter(Boolean);
    await this.set(`coefficients:${this.appid}`, JSON.stringify(coefficients));
    return coefficients;
  }

  async calculateCoefficients() {
    const cachedResult = await this.get(`coefficients:${this.appid}`);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    return this.calculateAndCacheCoefficients();
  }
}

module.exports = CoefficientCalculator;