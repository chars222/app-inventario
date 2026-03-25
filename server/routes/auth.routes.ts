import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { SECRET_KEY, authenticateToken } from '../middleware/auth';

const router = Router();

// --- LOGIN ---
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }, include: { business: true } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, businessId: user.businessId, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  res.json({ success: true, token, user });
});

// --- REGISTRO DE EMPRESA ---
router.post('/auth/register', async (req, res) => {
  const reqId = Math.floor(Math.random() * 10000); 
  const { businessName, fullName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); 

  try {
    const result = await prisma.$transaction(async (tx) => {
       const newBusiness = await tx.business.create({ data: { name: businessName } });
       const newUser = await tx.user.create({
          data: {
             email,
             passwordHash: hashedPassword,
             fullName,
             role: 'OWNER',
             businessId: newBusiness.id
          }
       });
       return { business: newBusiness, user: newUser };
    });

    const token = jwt.sign({ id: result.user.id, businessId: result.business.id }, SECRET_KEY);
    return res.json({ success: true, token, user: result.user });

  } catch (error: any) {
    if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Correo duplicado' });
    }
    return res.status(500).json({ error: "Server error" });
  }
});

// --- AGREGAR EMPLEADO ---
router.post('/users/add', authenticateToken, async (req: any, res: any) => {
  const { fullName, email, password,role } = req.body;
  const { businessId } = req.user;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashedPassword,
        role: role || 'SELLER',
        businessId: businessId
      }
    });

    res.json({ success: true, message: "Empleado creado", employee: newEmployee });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: "Email ya registrado" });
    res.status(500).json({ error: "Error creando empleado" });
  }
});

// --- LISTAR EQUIPO ---
router.get('/users', authenticateToken, async (req: any, res: any) => {
  const { businessId } = req.user;
  try {
    const users = await prisma.user.findMany({
      where: { businessId },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error listando usuarios" });
  }
});

router.post('/auth/change-password', authenticateToken, async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // 1. Verificamos que la contraseña actual sea correcta
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: "La contraseña actual es incorrecta" });

    // 2. Encriptamos la nueva y actualizamos
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    res.json({ success: true, message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error interno al cambiar contraseña" });
  }
});

// --- OLVIDÉ MI CONTRASEÑA (RECUPERACIÓN) ---
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Por seguridad, siempre respondemos "Éxito" para evitar enumeración de correos
    if (!user) return res.json({ success: true, message: "Si el correo existe, se han enviado las instrucciones." });

    // Aquí generarías un token temporal (ej. de 15 minutos)
    const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '15m' });

    // 📩 ENTORNO REAL: Aquí usarías SendGrid, AWS SES o Resend para enviar el correo.
    // await sendEmail(user.email, `app.centralmoda.store/reset?token=${resetToken}`);
    
    // Simulamos el envío
    console.log(`\n📧 SIMULACIÓN DE CORREO ENVIADO A: ${email}`);
    console.log(`🔗 Link de recuperación: https://app.centralmoda.store/reset?token=${resetToken}\n`);

    res.json({ success: true, message: "Instrucciones enviadas." });
  } catch (error) {
    res.status(500).json({ error: "Error en el proceso de recuperación" });
  }
});

export default router;