import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// --- CREAR VENTA ---
router.post('/sales', authenticateToken, async (req: any, res: any) => {
  const { items } = req.body;
  const { businessId, id: userId } = req.user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalSale = 0;

      for (const item of items) {
        const variation = await tx.variation.findUnique({ where: { id: item.variationId } });
        if (!variation || variation.stock < item.quantity) throw new Error(`Stock insuficiente`);

        await tx.variation.update({
          where: { id: item.variationId },
          data: { stock: { decrement: item.quantity } }
        });
        totalSale += (item.price * item.quantity);
      }

      const newSale = await tx.sale.create({
        data: {
          userId, businessId, total: totalSale, date: new Date(),
          items: {
            create: items.map((item: any) => ({
              variationId: item.variationId, quantity: item.quantity, price: item.price
            }))
          }
        },
        include: { items: { include: { variation: { include: { product: true } } } } }
      });
      return newSale;
    });

    res.json({ success: true, sale: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- LISTAR VENTAS ---
router.get('/sales', authenticateToken, async (req: any, res: any) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { businessId: req.user.businessId },
      include: {
        items: { include: { variation: { include: { product: { include: { category: true } } } } } },
        user: { select: { fullName: true, email: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(sales);
  } catch (error) { res.status(500).json({ error: "Error listando ventas" }); }
});

// --- DASHBOARD (PANTALLA PRINCIPAL) ---
router.get('/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(today); tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const revenueAggToday = await prisma.sale.aggregate({
      where: { userId, date: { gte: today, lt: tomorrowStart } },
      _sum: { total: true }
    });
    const totalRevenueToday = revenueAggToday._sum.total || 0;

    const lastSaleBeforeToday = await prisma.sale.findFirst({
      where: { userId, date: { lt: today } },
      orderBy: { date: 'desc' }, select: { date: true }
    });

    let growth = "+0%";
    if (lastSaleBeforeToday) {
      const lastSaleDate = new Date(lastSaleBeforeToday.date); lastSaleDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(lastSaleDate); nextDay.setDate(nextDay.getDate() + 1);

      const revenueAggLastSaleDay = await prisma.sale.aggregate({
        where: { userId, date: { gte: lastSaleDate, lt: nextDay } },
        _sum: { total: true }
      });
      const totalRevenueLastSaleDay = revenueAggLastSaleDay._sum.total || 0;

      if (totalRevenueLastSaleDay > 0) {
        const percentageChange = ((totalRevenueToday - totalRevenueLastSaleDay) / totalRevenueLastSaleDay) * 100;
        growth = `${percentageChange >= 0 ? "+" : ""}${Math.round(percentageChange)}%`;
      } else {
        growth = totalRevenueToday > 0 ? "+100%" : "+0%";
      }
    } else { growth = totalRevenueToday > 0 ? "+100%" : "+0%"; }

    const recentItems = await prisma.saleItem.findMany({
      where: { sale: { userId, date: { gte: today, lt: tomorrowStart } } },
      take: 20, orderBy: { sale: { date: 'desc' } },
      include: { sale: true, variation: { include: { product: { include: { category: true } } } } }
    });

    const transactions = recentItems.map(item => ({
      id: item.id,
      title: `${item.variation.product.name} (${item.variation.size})`, 
      status: ['Completado'], category: item.variation.product.category.name,
      iconKey: item.variation.product.category.iconKey,
      qty: item.quantity, price: item.price, date: item.sale.date,
      color: 'Blue', imageColor: 'bg-blue-50', iconColor: 'text-blue-600'
    }));

    res.json({ stats: { totalRevenue: totalRevenueToday, growth }, transactions });
  } catch (error) { res.status(500).json({ error: 'Error fetching dashboard' }); }
});

export default router;