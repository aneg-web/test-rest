const File = require('../models/File');
const { getFileInfo, deleteFile } = require('../utils/fileUtils');
const path = require('path');
const fs = require('fs');

// Загрузка файла
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Файл отсутствует' 
      });
    }

    // Получение информации о файле
    const fileInfo = getFileInfo(req.file);
    
    // Сохранение информации о файле в БД
    const file = await File.create({
      userId: req.user.id,
      ...fileInfo,
      uploadDate: new Date()
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Файл успешно загружен', 
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        extension: file.extension,
        mimeType: file.mimeType,
        size: file.size,
        uploadDate: file.uploadDate
      }
    });
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Получение списка файлов с пагинацией
const getFilesList = async (req, res) => {
  try {
    // Параметры пагинации
    const listSize = parseInt(req.query.list_size) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * listSize;
    
    // Получение файлов пользователя с пагинацией
    const { count, rows } = await File.findAndCountAll({
      where: { userId: req.user.id },
      limit: listSize,
      offset: offset,
      order: [['uploadDate', 'DESC']], // Сортировка по дате загрузки (новые сверху)
      attributes: [
        'id', 'filename', 'originalName', 'extension', 
        'mimeType', 'size', 'uploadDate', 'createdAt', 'updatedAt'
      ]
    });
    
    // Вычисляем общее количество страниц
    const totalPages = Math.ceil(count / listSize);
    
    return res.status(200).json({
      success: true,
      pagination: {
        totalFiles: count,
        totalPages,
        currentPage: page,
        pageSize: listSize
      },
      files: rows
    });
  } catch (error) {
    console.error('Ошибка при получении списка файлов:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Получение информации о файле по ID
const getFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Поиск файла
    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Файл не найден'
      });
    }
    
    return res.status(200).json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        extension: file.extension,
        mimeType: file.mimeType,
        size: file.size,
        uploadDate: file.uploadDate,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка при получении информации о файле:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Скачивание файла
const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Поиск файла
    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Файл не найден'
      });
    }
    
    // Проверка существования файла на диске
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'Файл не найден на диске'
      });
    }
    
    // Отправка файла клиенту
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Type', file.mimeType);
    
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Удаление файла
const deleteFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Поиск файла
    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Файл не найден'
      });
    }
    
    // Удаление файла с диска
    await deleteFile(file.path);
    
    // Удаление записи из базы данных
    await file.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Файл успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

// Обновление файла
const updateFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Файл отсутствует' 
      });
    }
    
    // Поиск файла
    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Файл не найден'
      });
    }
    
    // Запоминаем старый путь к файлу
    const oldFilePath = file.path;
    
    // Получение информации о новом файле
    const fileInfo = getFileInfo(req.file);
    
    // Обновление записи в базе данных
    await file.update({
      ...fileInfo,
      uploadDate: new Date()
    });
    
    // Удаление старого файла с диска
    await deleteFile(oldFilePath);
    
    return res.status(200).json({
      success: true,
      message: 'Файл успешно обновлен',
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        extension: file.extension,
        mimeType: file.mimeType,
        size: file.size,
        uploadDate: file.uploadDate
      }
    });
  } catch (error) {
    console.error('Ошибка при обновлении файла:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
};

module.exports = {
  uploadFile,
  getFilesList,
  getFileById,
  downloadFile,
  deleteFileById,
  updateFile
};