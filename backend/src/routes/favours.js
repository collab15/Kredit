const router = require('express').Router();
const c = require('../controllers/favours');
const { requireAuth, requireRole } = require('../middleware/auth');

const A           = requireAuth;
const notOrg      = requireRole('user', 'admin');

router.get('/',              A,         c.getFavours);
router.post('/',             A, notOrg, c.createFavour);
router.put('/:id/complete',  A, notOrg, c.completeFavour);
router.delete('/:id/ignore', A, notOrg, c.ignoreFavour);
router.delete('/:id',        A, notOrg, c.deleteFavour);

module.exports = router;
