const router = require('express').Router();

router.use('/auth',         require('./auth'));
router.use('/admins',       require('./admins'));
router.use('/users',        require('./users'));
router.use('/orgs',         require('./orgs'));
router.use('/favours',      require('./favours'));
router.use('/transactions', require('./transactions'));

module.exports = router;
