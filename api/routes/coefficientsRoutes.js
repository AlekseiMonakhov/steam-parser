const express = require('express');
const router = express.Router();
const CoefficientsController = require('../controllers/coefficientsController');

router.get('/coefficients/:appid', CoefficientsController.getCoefficients);

module.exports = router;
