const router = require('express').Router();
const { getPublicDashboard } = require('../controllers/dashboardController');

// Public — no auth required; called by the mobile app on launch
router.get('/', getPublicDashboard);

module.exports = router;
