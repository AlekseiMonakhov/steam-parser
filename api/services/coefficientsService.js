const CoefficientCalculator = require('./coefficientCalculator');

class CoefficientService {
  constructor(appid) {
    this.calculator = new CoefficientCalculator(appid);
  }

  async calculateCoefficients() {
    return this.calculator.calculateCoefficients();
  }

  async calculateAndCacheCoefficients() {
    return this.calculator.calculateAndCacheCoefficients();
  }
}

module.exports = CoefficientService;