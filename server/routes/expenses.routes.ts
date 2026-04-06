import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ==========================================
// 💸 MÓDULO DE EGRESOS Y GASTOS OPERATIVOS
// ==========================================

// --- 1. LISTAR GASTOS POR PERIODO ---
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { businessId } = req.user;
    const { from, to } = req.query;
    
    // Armamos el filtro de fechas (Igual que en ventas)
    let dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999); // Hasta el final del día
      dateFilter.lte = toDate;
    }

    const expenses = await prisma.expense.findMany({
      where: { 
        businessId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      orderBy: { date: 'desc' } // Los más recientes primero
    });

    res.json(expenses);
  } catch (error) {
    console.error("Error al listar gastos:", error);
    res.status(500).json({ error: "Error obteniendo el registro de gastos" });
  }
});

// --- 2. REGISTRAR NUEVO GASTO ---
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { concept, amount } = req.body;
    const { businessId, id: userId } = req.user;

    // Validación básica
    if (!concept || !amount) {
        return res.status(400).json({ error: "El concepto y el monto son obligatorios." });
    }

    const newExpense = await prisma.expense.create({
      data: {
        concept: concept.trim(),
        amount: Number(amount),
        businessId,
        createdById: userId
      }
    });

    res.json(newExpense);
  } catch (error) {
    console.error("Error al guardar gasto:", error);
    res.status(500).json({ error: "Error al registrar el gasto operativo" });
  }
});

// --- 3. ELIMINAR GASTO (Por si te equivocas) ---
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const expenseId = Number(req.params.id);
      const { businessId } = req.user;
  
      // Verificamos que el gasto exista y pertenezca al negocio del usuario
      const expense = await prisma.expense.findFirst({
          where: { id: expenseId, businessId }
      });
  
      if (!expense) return res.status(404).json({ error: "Gasto no encontrado o no autorizado." });
  
      await prisma.expense.delete({
          where: { id: expenseId }
      });
  
      res.json({ success: true, message: "Gasto eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
      res.status(500).json({ error: "Error interno al eliminar el gasto" });
    }
});

export default router;