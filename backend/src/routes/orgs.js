const router = require('express').Router();
const c      = require('../controllers/orgs');

router.get('/',            c.getOrgs);
router.post('/',           c.createOrg);
router.post('/reward',     c.rewardUser);      // before /:id
router.get('/agencies',    c.getAgencies);
router.get('/partnered',   c.getPartnered);
router.get('/:id',         c.getOrg);
router.delete('/:id',      c.deleteOrg);

module.exports = router;