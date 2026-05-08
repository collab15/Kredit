const router = require('express').Router();
const c = require('../controllers/transactions');
const { requireAuth } = require('../middleware/auth');

const A = requireAuth;

router.get('/stats',        A, c.getStats);
router.get('/peer',         A, c.getPeer);
router.get('/rewards',      A, c.getRewards);
router.get('/org-payments', A, c.getOrgPayments);
router.get('/',             A, c.getAll);

module.exports = router;
