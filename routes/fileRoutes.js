const express = require('express');
const router = express.Router();
const { 
  uploadFile, 
  getFilesList, 
  downloadFile, 
  deleteFileById, 
  updateFile, 
  getFileById
} = require('../controllers/fileController');
const { authenticate } = require('../middleware/authMiddleware');
const { upload } = require('../utils/fileUtils');

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/list', getFilesList);
router.get('/:id', getFileById);
router.get('/download/:id', downloadFile);
router.delete('/delete/:id', deleteFileById);
router.put('/update/:id', upload.single('file'), updateFile);

module.exports = router;