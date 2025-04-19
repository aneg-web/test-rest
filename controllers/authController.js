const User = require('../models/User');
const Token = require('../models/Token');
const { createTokens, invalidateTokens, generateToken, verifyToken } = require('../utils/jwtUtils');
const { body, validationResult } = require('express-validator');

// Валидация для регистрации и авторизации
const authValidation = [
  body('id')
    .notEmpty().withMessage('ID обязателен')
    .custom(value => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('ID должен быть email или номером телефона');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов')
];

// Регистрация нового пользователя
const signup = async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id, password } = req.body;

    // Проверка существования пользователя
    const existingUser = await User.findByPk(id);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Пользователь с таким ID уже существует' 
      });
    }

    // Создание нового пользователя
    const user = await User.create({ id, password });

    // Получение информации о клиенте
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;

    // Генерация токенов
    const { accessToken, refreshToken } = await createTokens(user.id, userAgent, ip);

    return res.status(201).json({ 
      success: true, 
      message: 'Пользователь успешно зарегистрирован', 
      accessToken, 
      refreshToken 
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Вход пользователя
const signin = async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id, password } = req.body;

    // Поиск пользователя
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный ID или пароль' 
      });
    }

    // Проверка пароля
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный ID или пароль' 
      });
    }

    // Получение информации о клиенте
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;

    // Генерация токенов
    const { accessToken, refreshToken } = await createTokens(user.id, userAgent, ip);

    return res.status(200).json({ 
      success: true, 
      message: 'Вход выполнен успешно', 
      accessToken, 
      refreshToken 
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Обновление токена
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Отсутствует refresh токен' 
      });
    }

    // Поиск токена в базе
    const tokenRecord = await Token.findOne({
      where: {
        refreshToken,
        isValid: true
      }
    });

    if (!tokenRecord) {
      return res.status(401).json({ 
        success: false, 
        message: 'Недействительный refresh токен' 
      });
    }

    // Проверка срока действия
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      // Инвалидируем истекший токен
      await Token.update(
        { isValid: false },
        { where: { id: tokenRecord.id } }
      );
      
      return res.status(401).json({ 
        success: false, 
        message: 'Срок действия refresh токена истек' 
      });
    }

    // Генерация нового access токена
    const accessToken = generateToken(tokenRecord.userId);

    return res.status(200).json({ 
      success: true, 
      accessToken 
    });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Информация о пользователе
const getUserInfo = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Выход из системы
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Отсутствует токен авторизации' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const { valid, decoded } = verifyToken(token);
    
    if (valid && decoded) {
      // Инвалидируем текущий токен пользователя
      await invalidateTokens(decoded.userId, req.body.refreshToken);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Выход выполнен успешно' 
    });
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

module.exports = {
  authValidation,
  signup,
  signin,
  refreshToken,
  getUserInfo,
  logout
};