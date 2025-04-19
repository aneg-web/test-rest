const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    if (!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

const getFileInfo = (file) => {
  const extension = path.extname(file.originalname).substring(1);
  
  return {
    filename: file.filename,
    originalName: file.originalname,
    extension: extension,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path
  };
};

const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    throw error;
  }
};

module.exports = {
  upload,
  getFileInfo,
  deleteFile
};