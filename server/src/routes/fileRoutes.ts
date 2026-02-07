import { Router } from 'express';
import { FileController } from '../controllers/FileController.js';
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
const controller = new FileController();
router.get('/', controller.listFiles);
router.get('/:id', controller.getFileMetadata);
router.post('/discover', controller.discoverFiles);
router.get('/:id/download', controller.downloadFile);
router.post('/upload', upload.single('file'), controller.uploadFile);
export default router;
