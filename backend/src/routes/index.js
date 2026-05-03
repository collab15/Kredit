const router = require('express').Router();

router.use('/users',        require('./users'));
router.use('/orgs',         require('./orgs'));
router.use('/favours',      require('./favours'));
router.use('/transactions', require('./transactions'));

module.exports = router;