const CoefficientService = require('../services/coefficientsService');

class CoefficientsController {
  async getCoefficients(req, res) {
    const { appid } = req.params;
    try {
      const service = new CoefficientService(appid);
      const coefficients = await service.calculateCoefficients();
      res.json(coefficients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async recalculateCoefficients(req, res) {
    const { appid } = req.params;
    try {
      const service = new CoefficientService(appid);
      const coefficients = await service.calculateAndCacheCoefficients();
      res.json(coefficients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CoefficientsController();