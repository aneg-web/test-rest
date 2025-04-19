const express = require('express');
const router = express.Router();
const { 
  authValidation,
  signup, 
  signin, 
  refreshToken, 
  getUserInfo, 
  logout 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/signup', authValidation, signup);
router.post('/signin', authValidation, signin);
router.post('/signin/new_token', refreshToken);

router.get('/info', authenticate, getUserInfo);
router.get('/logout', authenticate, logout);

module.exports = router;