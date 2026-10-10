import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Asegurarnos de que la carpeta exista
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.memoryStorage();

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Aumentamos a 10MB por si suben fotos pesadas
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Formato no válido. Solo se permiten imágenes.'));
    }
});


router.post('/upload', authenticateToken, upload.single('image'), async (req: any, res: any) => {
  console.log('📥 POST /upload recibido');

  try {
    if (!req.file) {
      console.log('❌ No llegó req.file');

      return res.status(400).json({
        error: 'No se envió ningún archivo'
      });
    }

    console.log('📷 Archivo recibido:', {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });

    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    const filename = `img-${uniqueSuffix}.webp`;

    const outputPath = path.join(
      uploadDir,
      filename
    );

    console.log('📁 Upload dir:', uploadDir);
    console.log('📁 Guardando en:', outputPath);

    await sharp(req.file.buffer)
      .resize({
        width: 1200,
        withoutEnlargement: true
      })
      .webp({
        quality: 80
      })
      .toFile(outputPath);

    console.log('✅ Imagen creada:', filename);

    const imageUrl = `/uploads/${filename}`;

    return res.json({
      success: true,
      url: imageUrl
    });

  } catch (error) {

    console.error(
      '❌ ERROR SHARP/UPLOAD:',
      error
    );

    return res.status(500).json({
      error: 'Error al procesar y optimizar la imagen'
    });
  }
});

export default router;