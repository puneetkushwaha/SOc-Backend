const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  updatePassword,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { protect, adminOnly, analystOrAdmin } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validate } = require('../utils/validators');

router.post('/register', registerLimiter, validateRegister, validate, register);
router.post('/login', loginLimiter, validateLogin, validate, login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

router.get('/users', protect, analystOrAdmin, getAllUsers);
router.get('/users/:id', protect, analystOrAdmin, getUser);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/deactivate', protect, adminOnly, deactivateUser);
router.put('/users/:id/activate', protect, adminOnly, activateUser);

module.exports = router;
