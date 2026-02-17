import { Router } from 'express';
import { listFiles, getFileMetadata, discoverFiles, downloadFile, uploadFile } from '../controllers/FileController.js';
import multer from 'multer';

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './uploads';
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });
const router = Router();
router.get('/', listFiles);
router.get('/:id', getFileMetadata);
router.post('/discover', discoverFiles);
router.get('/:id/download', downloadFile);
router.post('/upload', upload.single('file'), uploadFile);
export default router;
