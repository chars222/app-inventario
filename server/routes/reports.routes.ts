import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Nota: Estas rutas se montarán bajo "/reports" en index.ts. 
// Por lo tanto, router.get('/inventory') responderá a "/reports/inventory"

router.get('/inventory', authenticateToken, async (req: any, res: any) => {
  try {
    const products = await prisma.product.findMany({
      where: { businessId: req.user.businessId },
      include: { category: true, variations: true },
      orderBy: { name: 'asc' }
    });

    const report = products.map(p => {
      const totalStock = p.variations.reduce((sum, v) => sum + v.stock, 0);
      return {
        id: p.id, name: p.name, color: p.color, price: p.price, cost: p.cost,
        category: p.category.name, iconKey: p.category.iconKey, totalStock,
        stockValue: totalStock * p.cost, retailValue: totalStock * p.price,
        potentialProfit: (totalStock * p.price) - (totalStock * p.cost),
        variations: p.variations.sort((a, b) => a.size.localeCompare(b.size))
      };
    });

    const totals = {
      totalProducts: products.length,
      totalUnits: report.reduce((sum, p) => sum + p.totalStock, 0),
      totalStockValue: report.reduce((sum, p) => sum + p.stockValue, 0),
      totalRetailValue: report.reduce((sum, p) => sum + p.retailValue, 0),
      totalPotentialProfit: report.reduce((sum, p) => sum + p.potentialProfit, 0),
    };

    res.json({ totals, products: report });
  } catch (error) { res.status(500).json({ error: 'Error inventario' }); }
});

router.get('/sales', authenticateToken, async (req: any, res: any) => {
    const whereClause: any = { businessId: req.user.businessId };
  const { from, to } = req.query;


  try {
    // 1. Armamos el filtro de fechas si el frontend nos lo envía
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999); // Hasta el final del día
      dateFilter.lte = toDate;
    }

    // 2. Buscamos las ventas en ese rango de fechas
    const sales = await prisma.sale.findMany({
      where: {
        ...whereClause,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        items: {
          include: { variation: { include: { product: { include: { category: true } } } } }
        },
        user: { select: { fullName: true } }
      },
      orderBy: { date: 'desc' }
    });

    // 3. Mapeamos para calcular utilidades (Precio Venta - Costo)
    const salesWithProfit = sales.map(sale => {
      const items = sale.items.map(item => {
        const product = item.variation.product;
        const revenue = item.price * item.quantity;
        const cost = product.cost * item.quantity;
        const profit = revenue - cost;

        return {
          variationId: item.variation.id, productId: product.id, productName: product.name,
          color: product.color, iconKey: product.category.iconKey, category: product.category.name,
          size: item.variation.size, quantity: item.quantity, unitPrice: item.price,
          unitCost: product.cost, revenue, cost, profit,
          margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0',
        };
      });

      const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
      const totalCost = items.reduce((s, i) => s + i.cost, 0);
      const totalProfit = items.reduce((s, i) => s + i.profit, 0);

      return {
        saleId: sale.id, date: sale.date, seller: sale.user.fullName,
        totalRevenue, totalCost, totalProfit,
        margin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0',
        items,
      };
    });

    // 4. Agrupamos TODO por Producto -> Talla/Color (Para que el frontend lo dibuje bonito)
    const byProduct: Record<string, any> = {};
    salesWithProfit.forEach(sale => {
      sale.items.forEach(item => {
        const key = `${item.productId}`;
        if (!byProduct[key]) {
          byProduct[key] = {
            productId: item.productId, productName: item.productName, color: item.color,
            iconKey: item.iconKey, category: item.category, totalQuantity: 0,
            totalRevenue: 0, totalCost: 0, totalProfit: 0,
            bySizeAndColor: {} as Record<string, any>
          };
        }
        const p = byProduct[key];
        p.totalQuantity += item.quantity;
        p.totalRevenue += item.revenue;
        p.totalCost += item.cost;
        p.totalProfit += item.profit;

        const sizeKey = `${item.size}`;
        if (!p.bySizeAndColor[sizeKey]) {
          p.bySizeAndColor[sizeKey] = {
            color: item.color, size: item.size, quantity: 0, revenue: 0, cost: 0, profit: 0,
          };
        }
        p.bySizeAndColor[sizeKey].quantity += item.quantity;
        p.bySizeAndColor[sizeKey].revenue += item.revenue;
        p.bySizeAndColor[sizeKey].cost += item.cost;
        p.bySizeAndColor[sizeKey].profit += item.profit;
      });
    });

    const totals = {
      totalSales: sales.length,
      totalUnits: salesWithProfit.reduce((s, sale) => s + sale.items.reduce((si, i) => si + i.quantity, 0), 0),
      totalRevenue: salesWithProfit.reduce((s, sale) => s + sale.totalRevenue, 0),
      totalCost: salesWithProfit.reduce((s, sale) => s + sale.totalCost, 0),
      totalProfit: salesWithProfit.reduce((s, sale) => s + sale.totalProfit, 0),
    };

    res.json({
      totals,
      sales: salesWithProfit,
      byProduct: Object.values(byProduct).map(p => ({
        ...p,
        margin: p.totalRevenue > 0 ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(1) : '0',
        bySizeAndColor: Object.values(p.bySizeAndColor)
      })).sort((a: any, b: any) => b.totalProfit - a.totalProfit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de ventas' });
  }
});

router.get('/top-products', authenticateToken, async (req: any, res: any) => {
  const { businessId } = req.user;
  const { categoryId, from, to } = req.query;

  try {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: { businessId, ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }) },
        ...(categoryId && { variation: { product: { categoryId: Number(categoryId) } } })
      },
      include: { variation: { include: { product: { include: { category: true } } } } }
    });

    const productStats: Record<string, any> = {};

    saleItems.forEach(item => {
      const p = item.variation.product;
      if (!productStats[p.id]) {
        productStats[p.id] = {
          productId: p.id, name: p.name, color: p.color, category: p.category.name,
          iconKey: p.category.iconKey, totalQuantity: 0, totalRevenue: 0, sizes: {} as Record<string, number>
        };
      }
      productStats[p.id].totalQuantity += item.quantity;
      productStats[p.id].totalRevenue += (item.price * item.quantity);
      productStats[p.id].sizes[item.variation.size] = (productStats[p.id].sizes[item.variation.size] || 0) + item.quantity;
    });

    const sortedProducts = Object.values(productStats).sort((a: any, b: any) => b.totalQuantity - a.totalQuantity);
    res.json(sortedProducts);
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de top productos' });
  }
});

router.get('/sellers', authenticateToken, async (req: any, res: any) => {
  const { businessId } = req.user;
  const { from, to } = req.query;

  try {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const sales = await prisma.sale.findMany({
      where: { businessId, ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }) },
      include: { user: { select: { id: true, fullName: true, role: true } }, items: true }
    });

    const sellerStats: Record<number, any> = {};

    sales.forEach(sale => {
      const uid = sale.user.id;
      if (!sellerStats[uid]) {
        sellerStats[uid] = { id: uid, name: sale.user.fullName, role: sale.user.role, totalSalesCount: 0, totalRevenue: 0, totalItemsSold: 0 };
      }
      sellerStats[uid].totalSalesCount += 1;
      sellerStats[uid].totalRevenue += sale.total;
      sellerStats[uid].totalItemsSold += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    res.json(Object.values(sellerStats).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue));
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de vendedores' });
  }
});


router.get('/critical-stock', authenticateToken, async (req: any, res: any) => {
  const { businessId } = req.user;
  const threshold = Number(req.query.threshold) || 5;

  try {
    const criticalVariations = await prisma.variation.findMany({
      where: { stock: { lte: threshold }, product: { businessId: businessId } },
      include: { product: { include: { category: true } } },
      orderBy: { stock: 'asc' }
    });

    const grouped: Record<number, any> = {};
    criticalVariations.forEach(v => {
      const pid = v.product.id;
      if (!grouped[pid]) {
        grouped[pid] = {
          productId: pid, name: v.product.name, color: v.product.color,
          category: v.product.category.name, iconKey: v.product.category.iconKey, variations: []
        };
      }
      grouped[pid].variations.push({ id: v.id, size: v.size, stock: v.stock });
    });

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ error: 'Error generando reporte de stock crítico' });
  }
});

export default router;