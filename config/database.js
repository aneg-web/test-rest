const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Можно включить для отладки
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('База данных успешно подключена.');
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
  }
};

testConnection();

module.exports = sequelize;