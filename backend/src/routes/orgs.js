const router = require('express').Router();
const c = require('../controllers/orgs');
const { requireAuth, requireRole } = require('../middleware/auth');

const A            = requireAuth;
const admin        = requireRole('admin');
const adminOrOrg   = requireRole('admin', 'org');

router.get('/me',          A, requireRole('org'), c.getMyOrg);
router.get('/agencies',    A,                     c.getAgencies);
router.get('/partnered',   A,                     c.getPartnered);
router.post('/reward',     A, adminOrOrg,          c.rewardUser);
router.get('/',            A,                     c.getOrgs);
router.post('/',           A, admin,               c.createOrg);
router.get('/:id',         A,                     c.getOrg);
router.put('/:id',         A, adminOrOrg,          c.updateOrg);
router.delete('/:id',      A, admin,               c.deleteOrg);
router.get('/:id/balance-audit', A, adminOrOrg,    c.getOrgBalanceAudit);

module.exports = router;
