const { calculateCoefficients } = require('../services/coefficientsService');

const getCoefficients = async (req, res) => {
  const { appid } = req.params;
  try {
    const coefficients = await calculateCoefficients(appid);
    res.json(coefficients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCoefficients,
};
