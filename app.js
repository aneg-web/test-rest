const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = require('./config/database');
const User = require('./models/User');
const Token = require('./models/Token');
const File = require('./models/File');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.get('/', (req, res) => {
  res.json({ message: 'ERP.AERO API Сервер работает' });
});

app.use('/', authRoutes);
app.use('/file', fileRoutes);
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ресурс не найден' 
  });
});
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Внутренняя ошибка сервера', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('База данных синхронизирована');
  } catch (error) {
    console.error('Ошибка синхронизации базы данных:', error);
  }
};

syncDatabase();

module.exports = app;