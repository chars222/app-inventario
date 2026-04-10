import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'dotenv/config'; 

// 2. Importamos nuestras Rutas Modulares
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import salesRoutes from './routes/sales.routes';
import reportRoutes from './routes/reports.routes';
import expenseRoutes from './routes/expenses.routes';
import uploadRoutes from './routes/upload.routes'; 
import path from 'path'; 

// Configuraciones iniciales
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// <-- 2. EXPOSICIÓN PÚBLICA DE LA CARPETA DE IMÁGENES -->
// Esto permite que el navegador pueda entrar a http://tu-api.com/uploads/foto.jpg
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// ==========================================
// 🚀 MONTAJE DE RUTAS (La magia del orden)
// ==========================================
// Montamos las rutas básicas en la raíz "/"
app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', salesRoutes);
app.use('/', uploadRoutes); 
app.use('/expenses', expenseRoutes);


// Montamos la reportería bajo el prefijo "/reports"
app.use('/reports', reportRoutes);


// ==========================================
// 🧪 ENDPOINT DE DESARROLLO (SEED)
// ==========================================
app.post('/seed', async (req, res) => {
    // Aquí puedes dejar la lógica gigantesca de reseteo y creación de base de datos
    // ya que no es un archivo de uso en producción real.
    res.json({ success: true, message: "Seed ejecutado" });
});


// Levantar el Servidor
app.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`🚀 Servidor CENTRAL corriendo en el puerto ${PORT}`);
  console.log(`✅ Arquitectura Modular Inicializada`);
  console.log(`==========================================\n`);
});