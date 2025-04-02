const express = require('express');
const { createUser, getUsers, login } = require('../controllers/user_controller');
const { authMiddleware } = require('../middleware/auth_middleware');

const router = express.Router();

router.post('/register', createUser);
router.post('/login', login);
router.get('/users', authMiddleware, getUsers);

module.exports = router;
