const router = require('express').Router();
const c = require('../controllers/admins');
const { requireAuth, requireRole } = require('../middleware/auth');

const A     = requireAuth;
const admin = requireRole('admin');

router.get('/',    A, admin, c.getAdmins);
router.post('/',   A, admin, c.createAdmin);
router.get('/:id', A, admin, c.getAdmin);
router.put('/:id', A, admin, c.updateAdmin);
router.delete('/:id', A, admin, c.deleteAdmin);

module.exports = router;
