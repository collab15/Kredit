const router = require('express').Router();
const c      = require('../controllers/users');

router.get('/',                  c.getUsers);
router.post('/',                 c.createUser);
router.post('/transfer',         c.transferKreds);   // before /:id
router.get('/:id',               c.getUser);
router.get('/:id/transactions',  c.getUserTransactions);
router.put('/:id',               c.updateUser);
router.delete('/:id',            c.deleteUser);

module.exports = router;