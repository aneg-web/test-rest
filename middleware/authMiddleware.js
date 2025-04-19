const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Отсутствует токен авторизации' 
      });
    }
    const token = authHeader.split(' ')[1];
    const { valid, decoded, error } = verifyToken(token);
    if (!valid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Недействительный или истекший токен', 
        error 
      });
    }
    const user = await User.findByPk(decoded.userId);
   
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    req.user = {
      id: user.id
    };
    
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

module.exports = { authenticate };