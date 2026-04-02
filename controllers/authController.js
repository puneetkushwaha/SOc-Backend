const User = require('../models/User');
const {
  sendTokenResponse,
  addToBlacklist,
  verifyRefreshToken,
  signToken,
  signRefreshToken
} = require('../utils/jwt');
const { asyncHandler } = require('../utils/errorHandler');
const crypto = require('crypto');

const register = asyncHandler(async (req, res, next) => {
  console.log("REGISTER REQUEST BODY:", req.body);
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email'
    });
  }

  if (role === 'admin' && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can create admin accounts'
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  sendTokenResponse(user, 201, res);
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'No user found with that email'
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  console.log(`Password reset link for ${email}: ${resetUrl}`);

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to email'
  });
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

const login = asyncHandler(async (req, res, next) => {
  console.log("LOGIN REQUEST BODY:", req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Account is deactivated. Please contact administrator'
    });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  sendTokenResponse(user, 200, res);
});

const logout = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (token) {
    addToBlacklist(token);
  }

  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

const refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token not provided'
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    const newAccessToken = signToken({ id: user._id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res
      .status(200)
      .cookie('refreshToken', newRefreshToken, { ...options, httpOnly: true })
      .json({
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user
  });
});

const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email, // though normally we'd want a separate verification flow
    avatar: req.body.avatar,
    bio: req.body.bio,
    phone: req.body.phone,
    jobTitle: req.body.jobTitle,
    department: req.body.department,
    location: req.body.location
  };

  Object.keys(fieldsToUpdate).forEach(key =>
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  if (req.body.password) {
    return res.status(400).json({
      success: false,
      error: 'This route is not for password updates. Please use /update-password'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    user
  });
});

const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  sendTokenResponse(user, 200, res);
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
});

const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    user
  });
});

const updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (req.body.password) {
    delete req.body.password;
  }

  user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    user
  });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

const deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  user.isActive = false;
  user.refreshToken = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

const activateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  user.isActive = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User activated successfully'
  });
});

module.exports = {
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
};
