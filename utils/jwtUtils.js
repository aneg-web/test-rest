const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Token = require('../models/Token');
require('dotenv').config();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '10m' }
  );
};

const generateRefreshToken = () => {
  return uuidv4();
};

const createTokens = async (userId, userAgent, ip) => {
  const accessToken = generateToken(userId);
  const refreshToken = generateRefreshToken();
  
  const refreshExpiryMs = ms(process.env.REFRESH_TOKEN_EXPIRY || '30d');
  const expiresAt = new Date(Date.now() + refreshExpiryMs);
  
  await Token.create({
    userId,
    refreshToken,
    userAgent,
    ip,
    isValid: true,
    expiresAt
  });
  
  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

function ms(str) {
  const match = /^(\d+)([smhdw])$/.exec(str);
  if (!match) return 0;
  
  const num = parseInt(match[1], 10);
  const type = match[2];
  
  switch (type) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    case 'w': return num * 7 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

const invalidateTokens = async (userId, refreshToken = null) => {
  const whereClause = { userId, isValid: true };
  
  if (refreshToken) {
    whereClause.refreshToken = refreshToken;
  }
  
  await Token.update(
    { isValid: false },
    { where: whereClause }
  );
};

module.exports = {
  generateToken,
  generateRefreshToken,
  createTokens,
  verifyToken,
  invalidateTokens
};