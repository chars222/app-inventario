import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// Obtener TODO el catálogo público

// 1. Obtener catálogo filtrado por Empresa (BusinessId)
router.get('/business/:businessId/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { businessId: Number(req.params.businessId) },
      include: { category: true, variations: true },
      orderBy: { id: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar el catálogo" });
  }
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