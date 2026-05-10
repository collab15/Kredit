const router = require('express').Router();
const c = require('../controllers/users');
const { requireAuth, requireRole } = require('../middleware/auth');

const A           = requireAuth;
const admin       = requireRole('admin');
const userOrAdmin = requireRole('user', 'admin');
const anyAuth     = requireRole('user', 'admin', 'org');

router.post('/transfer',         A, userOrAdmin, c.transferKreds);
router.post('/transfer-to-org',  A, userOrAdmin, c.transferToOrg);
router.get('/lookup',            A, anyAuth,     c.lookupUser);
router.get('/',                  A, admin,        c.getUsers);
router.post('/',                 A, admin,        c.createUser);
router.get('/:id',               A,               c.getUser);
router.put('/:id',               A,               c.updateUser);
router.delete('/:id',            A, admin,        c.deleteUser);
router.get('/:id/transactions',  A,               c.getUserTransactions);
router.get('/:id/balance-audit', A,               c.getUserBalanceAudit);

module.exports = router;
