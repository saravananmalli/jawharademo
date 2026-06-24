const router = require('express').Router();
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getActiveOffer,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getHotDeals,
} = require('../controllers/offerController');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/active',    getActiveOffer);
router.get('/hot-deals', getHotDeals);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/',         auth, adminOnly, getAllOffers);
router.post('/',        auth, adminOnly, createOffer);
router.put('/:id',      auth, adminOnly, updateOffer);
router.delete('/:id',   auth, adminOnly, deleteOffer);

module.exports = router;
