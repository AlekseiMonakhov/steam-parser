const CoefficientCalculator = require('../services/coefficientsService');

class CoefficientsController {
  async getCoefficients(req, res) {
    const { appid } = req.params;
    try {
      const calculator = new CoefficientCalculator(appid);
      const coefficients = await calculator.calculateCoefficients();
      res.json(coefficients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async recalculateCoefficients(req, res) {
    const { appid } = req.params;
    try {
      const calculator = new CoefficientCalculator(appid);
      const coefficients = await calculator.calculateAndCacheCoefficients();
      res.json(coefficients);
    } catch (error) {
      res.status(500)
    }
  }
}

module.exports = new CoefficientsController();
