const router = require('express').Router();
const c      = require('../controllers/transactions');

router.get('/',       c.getAll);
router.get('/stats',  c.getStats);
router.get('/peer',   c.getPeer);
router.get('/rewards',c.getRewards);

module.exports = router;