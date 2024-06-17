const express = require('express');
const router = express.Router();
const CoefficientsController = require('../controllers/coefficientsController');

router.get('/coefficients/:appid', (req, res, next) => {
    next();
}, CoefficientsController.getCoefficients);

router.get('/recalculate-coefficients/:appid', (req, res, next) => {
    next();
}, CoefficientsController.recalculateCoefficients);

module.exports = router;
