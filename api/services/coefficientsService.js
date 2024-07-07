const pool = require('../database/db');
const client = require('../database/redisClient');
const { performance } = require('perf_hooks');

class CoefficientCalculator {
  constructor(appid) {
    this.appid = appid;
  }

  async cacheGet(key) {
    const start = performance.now();
    try {
      const result = await client.get(key);
      console.log(`cacheGet(${key}): ${performance.now() - start}ms`);
      return result;
    } catch (err) {
      console.log(`cacheGet(${key}) failed: ${performance.now() - start}ms`);
      throw err;
    }
  }

  async cacheSet(key, value, expiration = 21600) {
    const start = performance.now();
    try {
      await client.set(key, value, { EX: expiration });
      console.log(`cacheSet(${key}): ${performance.now() - start}ms`);
    } catch (err) {
      console.log(`cacheSet(${key}) failed: ${performance.now() - start}ms`);
      throw err;
    }
  }

  async queryWithCache(key, query, params = []) {
    const start = performance.now();
    const cachedResult = await this.cacheGet(key);
    if (cachedResult) {
      console.log(`queryWithCache(${key}): cache hit - ${performance.now() - start}ms`);
      return JSON.parse(cachedResult);
    }
    const queryStart = performance.now();
    const result = await pool.query(query, params);
    console.log(`queryWithCache(${key}): SQL query - ${performance.now() - queryStart}ms`);
    await this.cacheSet(key, JSON.stringify(result.rows));
    console.log(`queryWithCache(${key}): total - ${performance.now() - start}ms`);
    return result.rows;
  }

  async getCoefficientL(item_id) {
    const start = performance.now();
    const query = `
      SELECT SUM(volume) / 30 AS coefficientL
      FROM price_history
      WHERE date >= NOW() - INTERVAL '30 days'
        AND item_id = $1
    `;
    const result = await this.queryWithCache(`coefficientL:${item_id}`, query, [item_id]);
    console.log(`getCoefficientL(${item_id}): ${performance.now() - start}ms`);
    return result[0]?.coefficientl;
  }

  async getCoefficientSR(item_id) {
    const start = performance.now();
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
    console.log(`getCoefficientSR(${item_id}): ${performance.now() - start}ms`);
    return result[0]?.coefficientsr;
  }

  async getCoefficientSRN(item_id) {
    const start = performance.now();
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
    console.log(`getCoefficientSRN(${item_id}): ${performance.now() - start}ms`);
    return result[0]?.coefficientsrn;
  }

  async getCoefficientV(item_id) {
    const start = performance.now();
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
    console.log(`getCoefficientV(${item_id}): ${performance.now() - start}ms`);
    return result[0]?.coefficientv;
  }

  async getCoefficientS1(item_id, coefficientSR) {
    const start = performance.now();
    const query = `
      SELECT SUM(price * volume) / SUM(volume) AS coefficientS1
      FROM price_history
      WHERE price > $1
        AND item_id = $2
    `;
    const result = await this.queryWithCache(`coefficientS1:${item_id}:${coefficientSR}`, query, [coefficientSR, item_id]);
    console.log(`getCoefficientS1(${item_id}, ${coefficientSR}): ${performance.now() - start}ms`);
    return result[0]?.coefficients1;
  }

  async getCoefficientS2(item_id, coefficientSR) {
    const start = performance.now();
    const query = `
      SELECT SUM(price * volume) / SUM(volume) AS coefficientS2
      FROM price_history
      WHERE price < $1
        AND item_id = $2
    `;
    const result = await this.queryWithCache(`coefficientS2:${item_id}:${coefficientSR}`, query, [coefficientSR, item_id]);
    console.log(`getCoefficientS2(${item_id}, ${coefficientSR}): ${performance.now() - start}ms`);
    return result[0]?.coefficients2;
  }

  getCoefficientS3(coefficientS1) {
    const start = performance.now();
    const result = coefficientS1 / 30;
    console.log(`getCoefficientS3(${coefficientS1}): ${performance.now() - start}ms`);
    return result;
  }

  getCoefficientS4(coefficientS2) {
    const start = performance.now();
    const result = coefficientS2 / 30;
    console.log(`getCoefficientS4(${coefficientS2}): ${performance.now() - start}ms`);
    return result;
  }

  getCoefficientP(coefficientS4, coefficientS3) {
    const start = performance.now();
    const result = (coefficientS4 * 0.87) / coefficientS3;
    console.log(`getCoefficientP(${coefficientS4}, ${coefficientS3}): ${performance.now() - start}ms`);
    return result;
  }

  async getBuyOrders(item_id, coefficientSR) {
    const start = performance.now();

    if (coefficientSR == null || coefficientSR === 0) {
      console.log(`getBuyOrders(${item_id}, ${coefficientSR}): coefficientSR is invalid. Skipping query. Total execution time: ${performance.now() - start}ms`);
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

    const queryStart = performance.now();
    const result = await pool.query(query, [item_id, coefficientSR * 0.5]);
    console.log(`Query execution time: ${performance.now() - queryStart}ms`);

    if (result.rows.length > 0) {
      console.log(`getBuyOrders(${item_id}, ${coefficientSR}): Found orders. Total execution time: ${performance.now() - start}ms`);
      return result.rows;
    }

    console.log(`getBuyOrders(${item_id}, ${coefficientSR}): No orders found. Total execution time: ${performance.now() - start}ms`);
    return [];
  }


  calculatePZCoefficients(buyOrders, coefficientL, coefficientSR) {
    const start = performance.now();

    if (!buyOrders || buyOrders.length === 0 || !coefficientL || !coefficientSR) {
      console.log(`buyOrders - ${buyOrders}`);
      console.log(`calculatePZCoefficients: empty data - ${performance.now() - start}ms`);
      return { topCoefficientPZ: { price: 0, coefficientPZ: 0 }, top20PZCoefficients: [] };
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

    console.log(`calculatePZCoefficients: ${performance.now() - start}ms`);
    return { topCoefficientPZ, top100PZCoefficients };
  }

  async calculateAndCacheCoefficients() {
    const start = performance.now();
    const itemsQuery = `
      SELECT id, market_name
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

      // if (coefficientSRResult !== 0 && topCoefficientPZ.coefficientPZ !== 0) {
        return {
          market_name: item.market_name,
          coefficientL: coefficientLResult,
          coefficientSR: coefficientSRResult,
          coefficientSRN: coefficientSRNResult,
          coefficientV: coefficientVResult,
          coefficientP,
          coefficientPZ: topCoefficientPZ,
          top100PZCoefficients,
        };
      // }
    });

    const coefficients = (await Promise.all(coefficientPromises)).filter(Boolean);
    await this.cacheSet(`coefficients:${this.appid}`, JSON.stringify(coefficients));
    console.log(`calculateAndCacheCoefficients: ${performance.now() - start}ms`);
    return coefficients;
  }

  async calculateCoefficients() {
    const start = performance.now();
    const cachedResult = await this.cacheGet(`coefficients:${this.appid}`);
    if (cachedResult) {
      console.log(`calculateCoefficients: cache hit - ${performance.now() - start}ms`);
      return JSON.parse(cachedResult);
    }
    console.log(`calculateCoefficients: cache miss - ${performance.now() - start}ms`);
    return this.calculateAndCacheCoefficients();
  }
}

module.exports = CoefficientCalculator;
