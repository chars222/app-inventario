import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// Obtener TODO el catálogo público
router.get('/products/:businessId', async (req, res) => {
  const businessId = req.params.businessId;
  const products = await prisma.product.findMany({
    where: { businessId: Number(businessId) },
    include: { category: true, variations: true },
    orderBy: { name: 'asc' }
  });

  const inventoryList = products.map(p => ({
     id: p.id, name: p.name, price: p.price, cost: p.cost, color: p.color,
     totalStock: p.variations.reduce((sum, v) => sum + v.stock, 0),
     category: p.category, variations: p.variations
  }));
  res.json(inventoryList);
});

// Obtener el detalle de UN solo producto por su ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true, variations: true }
    });
    
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar detalle del producto" });
  }
});

export default router;