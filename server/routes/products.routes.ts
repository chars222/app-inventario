import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// --- CATEGORÍAS ---
router.get('/categories', authenticateToken, async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// --- CREAR PRODUCTO ---
router.post('/products', authenticateToken, async (req: any, res: any) => {
  const { name, cost, price, color, categoryId, variations } = req.body;
  const { businessId, id: userId } = req.user;

  try {
    const newProduct = await prisma.product.create({
      data: {
        name, cost: Number(cost), price: Number(price), color,
        categoryId: Number(categoryId), businessId, createdById: userId,
        ...(variations && variations.length > 0 && {
          variations: {
            create: variations.map((v: any) => ({ size: v.size, stock: v.stock || 0 }))
          }
        })
      },
      include: { variations: true, category: true }
    });
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ error: "No se pudo crear el producto" });
  }
});

// --- LISTAR PRODUCTOS ---
router.get('/products', authenticateToken, async (req: any, res: any) => {
  const businessId = req.user.businessId;
  const products = await prisma.product.findMany({
    where: { businessId },
    include: { category: true, variations: true },
    orderBy: { name: 'asc' }
  });

  const inventoryList = products.map(p => ({
     id: p.id, name: p.name, price: p.price, cost: p.cost, color: p.color,
     totalStock: p.variations.reduce((sum, v) => sum + v.stock, 0),
     category: p.category, variations: p.variations,
     // Añadimos los campos visuales para que el AdminDashboard pueda leerlos
     imageUrl: p.imageUrl, gallery: p.gallery, description: p.description
  }));
  res.json(inventoryList);
});

// --- OBTENER UN PRODUCTO ---
router.get('/products/:id', authenticateToken, async (req: any, res: any) => {
  const product = await prisma.product.findFirst({
    where: { id: Number(req.params.id), businessId: req.user.businessId },
    include: { category: true, variations: true }
  });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

// --- EDITAR PRODUCTO ---
router.put('/products/:id', authenticateToken, async (req: any, res: any) => {
  // 1. EXTRAER LOS NUEVOS CAMPOS (imageUrl, gallery, description)
  const { name, cost, price, color, categoryId, imageUrl, gallery, description } = req.body;
  try {
    const updated = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name, cost: cost ? Number(cost) : undefined, price: price ? Number(price) : undefined,
        color, categoryId: categoryId ? Number(categoryId) : undefined, updatedById: req.user.id,
        // 2. GUARDAR LOS CAMPOS EN LA BASE DE DATOS
        imageUrl,
        gallery,
        description
      },
      include: { category: true, variations: true }
    });
    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

// --- ELIMINAR PRODUCTO ---
router.delete('/products/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.variation.deleteMany({ where: { productId: Number(req.params.id) } });
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

// --- AGREGAR STOCK ---
router.post('/stock/add', authenticateToken, async (req: any, res: any) => {
  const { productId, size, quantity, newPrice } = req.body;
  try {
    const variation = await prisma.variation.findFirst({
      where: { productId: Number(productId), size: String(size) }
    });

    if (variation) {
      await prisma.variation.update({
        where: { id: variation.id },
        data: { stock: { increment: Number(quantity) } }
      });
    } else {
      await prisma.variation.create({
        data: { productId: Number(productId), size: String(size), stock: Number(quantity) }
      });
    }

    if (newPrice && Number(newPrice) > 0) {
      await prisma.product.update({
        where: { id: Number(productId) },
        data: { price: Number(newPrice), updatedById: req.user.id }
      });
    }
    res.json({ success: true, message: "Stock actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando inventario" });
  }
});

// --- ACTUALIZAR/ELIMINAR VARIACIÓN ---
router.put('/variations/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const updated = await prisma.variation.update({
      where: { id: Number(req.params.id) },
      data: { stock: Number(req.body.stock) },
      include: { product: { include: { category: true } } }
    });
    res.json({ success: true, variation: updated });
  } catch (error) { res.status(500).json({ error: "Error actualizando variación" }); }
});

router.delete('/variations/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const salesWithVariation = await prisma.saleItem.count({ where: { variationId: Number(req.params.id) } });
    if (salesWithVariation > 0) return res.status(400).json({ error: "Hay ventas asociadas" });
    
    await prisma.variation.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: "Variación eliminada" });
  } catch (error) { res.status(500).json({ error: "Error eliminando variación" }); }
});

export default router;