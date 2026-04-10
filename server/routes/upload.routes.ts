import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Asegurarnos de que la carpeta exista
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer (Dónde y cómo guardar)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Generar un nombre único: img-16345345345-12345.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por foto
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Formato no válido. Solo se permiten imágenes.'));
    }
});

// Endpoint para subir una imagen
router.post('/upload', authenticateToken, upload.single('image'), (req: any, res: any) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo' });
    }
    
    // Devolvemos la ruta relativa donde quedó guardada la imagen
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

export default router;