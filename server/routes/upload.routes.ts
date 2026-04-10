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


// Endpoint para subir una imagen
router.post('/upload', authenticateToken, upload.single('image'), async (req: any, res: any) => {
  try {
    if (!req.file) {
        return res.status(400).json({ error: 'No se envió ningún archivo' });
    }
    
    // Generamos el nombre del archivo, pero SIEMPRE terminando en .webp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `img-${uniqueSuffix}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // 🚀 MAGIA DE SHARP: Procesamiento de la imagen
    await sharp(req.file.buffer)
        .resize({ 
            width: 1200, // Si la imagen es más grande de 1200px de ancho, la achica
            withoutEnlargement: true // Si es más pequeña, no la estira
        })
        .webp({ quality: 80 }) // Convierte a WEBP con 80% de calidad (Pérdida invisible al ojo)
        .toFile(outputPath); // Guarda el archivo en tu volumen de Hetzner

    // Devolvemos la ruta webp
    const imageUrl = `/uploads/${filename}`;
    res.json({ success: true, url: imageUrl });
    
  } catch (error) {
    console.error("Error al procesar la imagen con Sharp:", error);
    res.status(500).json({ error: 'Error al procesar y optimizar la imagen' });
  }
});

export default router;