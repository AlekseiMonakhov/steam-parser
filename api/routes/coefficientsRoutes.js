const express = require('express');
const router = express.Router();
const { getCoefficients } = require('../controllers/coefficientsController');

router.get('/coefficients/:appid', (req, res, next) => {
  console.log(`Handling request for /coefficients/${req.params.appid}`);
  next();
}, getCoefficients);

module.exports = router;
