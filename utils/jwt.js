const jwt = require('jsonwebtoken');

// Token blacklist for logout
let tokenBlacklist = new Set();

// Sign JWT token
const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// Sign refresh token
const signRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw error;
    }
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
    // Create token
    const token = signToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            message,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};

// Add token to blacklist
const addToBlacklist = (token) => {
    tokenBlacklist.add(token);
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
    return tokenBlacklist.has(token);
};

module.exports = {
    signToken,
    signRefreshToken,
    verifyRefreshToken,
    sendTokenResponse,
    addToBlacklist,
    isTokenBlacklisted
};