const router = require('express').Router();
const c      = require('../controllers/favours');

router.get('/',                    c.getFavours);
router.post('/',                   c.createFavour);
router.put('/:id/complete',        c.completeFavour);
router.delete('/:id',              c.deleteFavour);

module.exports = router;