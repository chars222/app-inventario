import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient } from './prisma-client';

// Load environment variables from .env file
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key_change_in_prod";

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 2. MIDDLEWARE DE AUTENTICACIÓN (El Portero)
// Este código se pondrá antes de cualquier ruta privada
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN_AQUI"

  if (!token) return res.status(401).json({ error: "Acceso denegado: Falta Token" });

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Token inválido o expirado" });
    
    // ¡ÉXITO! Guardamos los datos del usuario en la request
    req.user = user; 
    next();
  });
};

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }, include: { business: true } });

  // Comparamos el hash
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // FIRMAMOS EL TOKEN (Aquí va la info crítica)
  const token = jwt.sign(
    { id: user.id, businessId: user.businessId, role: user.role }, // Payload
    SECRET_KEY,
    { expiresIn: '24h' } // Expira en 1 día
  );

  res.json({ success: true, token, user });
});

app.get('/categories', authenticateToken, async (req, res) => {
  const categories = await prisma.category.findMany();
  console.log( "Categorías disponibles:", categories);
  res.json(categories);
});
// --- 1. Endpoint para llenar la DB con datos de prueba (Seed) ---
app.post('/seed', async (req, res) => {
  try {
    // 1. LIMPIEZA TOTAL (Orden crítico por claves foráneas)
    console.log("🧹 Iniciando limpieza...");
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.variation.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();     // Borramos usuarios antes que negocios
    await prisma.business.deleteMany(); // Borramos negocios
    await prisma.category.deleteMany();

    console.log("✨ Base de datos limpia.");

    // 2. INSERTAR CATEGORÍAS (Catálogo Global)
    await prisma.category.createMany({
      data: [
        // Ropa Superior (Letras)
        { name: 'Poleras', iconKey: 'Poleras', sizeType: 'LETTER' },
        { name: 'Camisas', iconKey: 'Camisas', sizeType: 'LETTER' },
        { name: 'Polos', iconKey: 'Polos', sizeType: 'LETTER' },
        { name: 'Chaquetas', iconKey: 'Chaquetas', sizeType: 'LETTER' },
        { name: 'Vestidos', iconKey: 'Vestidos', sizeType: 'LETTER' },
        // Ropa Inferior (Números)
        { name: 'Pantalones', iconKey: 'Pantalones', sizeType: 'NUMERIC' },
        { name: 'Jeans', iconKey: 'Pantalones', sizeType: 'NUMERIC' },
        { name: 'Shorts', iconKey: 'Pantalones', sizeType: 'NUMERIC' },
        // Calzado
        { name: 'Zapatos', iconKey: 'Pantalones', sizeType: 'SHOES' }
      ]
    });

    // 3. CREAR EL NEGOCIO (Entidad Padre)
    const business = await prisma.business.create({
      data: {
        name: 'ADM ENTERPRISES' // Puedes cambiar el nombre de tu negocio aquí
      }
    });

    // 4. CREAR USUARIO DUEÑO (Vinculado al Negocio)
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await prisma.user.create({
      data: {
        email: 'cumpito20@gmail.com',
        passwordHash: hashedPassword,
        fullName: 'Carlos Admin',
        role: 'OWNER',
        businessId: business.id // <--- Conexión clave
      }
    });

    console.log("🏢 Negocio y Usuario creados.");

    // 5. RECUPERAR IDs DE CATEGORÍAS
    const catPolera = await prisma.category.findFirst({ where: { name: 'Poleras' } });
    const catPantalon = await prisma.category.findFirst({ where: { name: 'Pantalones' } });
    const catCamisa = await prisma.category.findFirst({ where: { name: 'Camisas' } });

    if (!catPolera || !catPantalon || !catCamisa) throw new Error("Error recuperando categorías");

    // 6. CREAR PRODUCTOS (Vinculados al Negocio y al Creador)
    
    // Producto 1: Polera Azul
    const polera = await prisma.product.create({
      data: {
        name: 'Polera Cotton Blue',
        cost: 15.00,
        price: 25.00,
        color: 'Blue',
        categoryId: catPolera.id,
        businessId: business.id, // Pertenece a CENTRAL
        createdById: user.id,    // Creado por Carlos (Auditoría)
        variations: {
          create: [
            { size: 'S', stock: 10 },
            { size: 'M', stock: 25 },
            { size: 'L', stock: 15 },
            { size: 'XL', stock: 5 }
          ]
        }
      }
    });

    // Producto 2: Jeans
    const jeans = await prisma.product.create({
      data: {
        name: 'Jeans Slim Fit',
        cost: 95.00,
        price: 145.00,
        color: 'Navy',
        categoryId: catPantalon.id,
        businessId: business.id,
        createdById: user.id,
        variations: {
          create: [
            { size: '30', stock: 8 },
            { size: '32', stock: 12 },
            { size: '34', stock: 10 }
          ]
        }
      }
    });

    // Producto 3: Camisa Formal
    const camisa = await prisma.product.create({
      data: {
        name: 'Camisa Oxford Blanca',
        cost: 120.00,
        price: 180.00,
        color: 'White',
        categoryId: catCamisa.id,
        businessId: business.id,
        createdById: user.id,
        variations: {
          create: [
            { size: 'M', stock: 5 },
            { size: 'L', stock: 5 }
          ]
        }
      }
    });

    console.log("📦 Inventario cargado.");

    // 7. GENERAR VENTAS HISTÓRICAS
    const varPoleraM = await prisma.variation.findFirst({ where: { productId: polera.id, size: 'M' } });
    const varJean32 = await prisma.variation.findFirst({ where: { productId: jeans.id, size: '32' } });

    if (varPoleraM && varJean32) {
      await prisma.sale.create({
        data: {
          userId: user.id,          // Vendedor: Carlos
          businessId: business.id,  // Caja: CENTRAL
          total: 50.00,
          date: new Date('2026-01-20'),
          items: {
            create: [
              { variationId: varPoleraM.id, quantity: 2, price: 25.00 }
            ]
          }
        }
      });

      await prisma.sale.create({
        data: {
          userId: user.id,
          businessId: business.id,
          total: 170.00,
          date: new Date(),
          items: {
            create: [
              { variationId: varJean32.id, quantity: 1, price: 145.00 },
              { variationId: varPoleraM.id, quantity: 1, price: 25.00 }
            ]
          }
        }
      });
    }

    res.json({ success: true, message: 'Base de datos reiniciada con Estructura Empresarial 🚀' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar seed' });
  }
});

app.post('/products', authenticateToken, async (req: any, res: any) => {
  const { name, cost, price, color, categoryId, variations } = req.body;
  const { businessId, id: userId } = req.user; // Datos del Token

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        cost: Number(cost),
        price: Number(price),
        color,
        categoryId: Number(categoryId),
        businessId: businessId,   // Vinculado a tu empresa
        createdById: userId,      // Vinculado a ti (Auditoría)
        // Crear variaciones si se proporcionan
        ...(variations && variations.length > 0 && {
          variations: {
            create: variations.map((v: any) => ({
              size: v.size,
              stock: v.stock || 0
            }))
          }
        })
      },
      include: {
        variations: true,
        category: true
      }
    });
    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ error: "No se pudo crear el producto" });
  }
});
// --- ENDPOINT PANTALLA PRINCIPAL (INVENTARIO ACTIVO) ---
app.get('/products', authenticateToken, async (req: any, res: any) => {
  const businessId = req.user.businessId;

  if (!businessId) return res.status(400).json({ error: "Falta businessId" });

  const products = await prisma.product.findMany({
    where: { businessId: businessId },
    include: {
      category: true,
      variations: true
    },
    orderBy: { name: 'asc' }
  });

  const inventoryList = products.map(p => ({
     id: p.id,
     name: p.name,
     price: p.price,
     cost: p.cost,
     color: p.color,
     totalStock: p.variations.reduce((sum, v) => sum + v.stock, 0),
     category: p.category,
     variations: p.variations
  }));

  res.json(inventoryList);
});

// --- GET UN PRODUCTO ESPECÍFICO ---
app.get('/products/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { businessId } = req.user;

  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(id), businessId },
      include: {
        category: true,
        variations: true
      }
    });

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error en servidor" });
  }
});

// --- EDITAR PRODUCTO ---
app.put('/products/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { name, cost, price, color, categoryId } = req.body;
  const { businessId, id: userId } = req.user;

  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(id), businessId }
    });

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name || product.name,
        cost: cost ? Number(cost) : product.cost,
        price: price ? Number(price) : product.price,
        color: color || product.color,
        categoryId: categoryId ? Number(categoryId) : product.categoryId,
        updatedById: userId
      },
      include: {
        category: true,
        variations: true
      }
    });

    res.json({ success: true, product: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

// --- ELIMINAR PRODUCTO ---
app.delete('/products/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { businessId } = req.user;

  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(id), businessId }
    });

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    await prisma.variation.deleteMany({
      where: { productId: Number(id) }
    });

    await prisma.product.delete({
      where: { id: Number(id) }
    });

    res.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

// --- AGREGAR STOCK (crear o actualizar variación) ---
app.post('/stock/add', authenticateToken, async (req: any, res: any) => {
  const { productId, size, quantity, newPrice } = req.body;
  const { businessId, id: userId } = req.user;

  try {
    const product = await prisma.product.findFirst({
      where: { id: Number(productId), businessId }
    });

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

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
        data: {
          productId: Number(productId),
          size: String(size),
          stock: Number(quantity)
        }
      });
    }

    if (newPrice && Number(newPrice) > 0) {
      await prisma.product.update({
        where: { id: Number(productId) },
        data: { 
          price: Number(newPrice),
          updatedById: userId
        }
      });
    }

    res.json({ success: true, message: "Stock actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando inventario" });
  }
});

// --- ACTUALIZAR VARIACIÓN ESPECÍFICA ---
app.put('/variations/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { stock } = req.body;
  const { businessId } = req.user;

  try {
    const variation = await prisma.variation.findUnique({
      where: { id: Number(id) },
      include: { product: true }
    });

    if (!variation || variation.product.businessId !== businessId) {
      return res.status(404).json({ error: "Variación no encontrada" });
    }

    const updated = await prisma.variation.update({
      where: { id: Number(id) },
      data: { stock: Number(stock) },
      include: {
        product: { include: { category: true } }
      }
    });

    res.json({ success: true, variation: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando variación" });
  }
});

// --- ELIMINAR VARIACIÓN ---
app.delete('/variations/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { businessId } = req.user;

  try {
    const variation = await prisma.variation.findUnique({
      where: { id: Number(id) },
      include: { product: true }
    });

    if (!variation || variation.product.businessId !== businessId) {
      return res.status(404).json({ error: "Variación no encontrada" });
    }

    const salesWithVariation = await prisma.saleItem.count({
      where: { variationId: Number(id) }
    });

    if (salesWithVariation > 0) {
      return res.status(400).json({ error: "No se puede eliminar: hay ventas asociadas" });
    }

    await prisma.variation.delete({
      where: { id: Number(id) }
    });

    res.json({ success: true, message: "Variación eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando variación" });
  }
});


// --- CREAR VENTA ---
app.post('/sales', authenticateToken, async (req: any, res: any) => {
  const { items } = req.body;
  const { businessId, id: userId } = req.user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalSale = 0;

      for (const item of items) {
        const variation = await tx.variation.findUnique({
          where: { id: item.variationId }
        });

        if (!variation || variation.stock < item.quantity) {
          throw new Error(`Stock insuficiente`);
        }

        await tx.variation.update({
          where: { id: item.variationId },
          data: { stock: { decrement: item.quantity } }
        });

        totalSale += (item.price * item.quantity);
      }

      const newSale = await tx.sale.create({
        data: {
          userId: userId,
          businessId: businessId,
          total: totalSale,
          date: new Date(),
          items: {
            create: items.map((item: any) => ({
              variationId: item.variationId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: {
            include: {
              variation: { include: { product: true } }
            }
          }
        }
      });

      return newSale;
    });

    res.json({ success: true, sale: result });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// --- LISTAR VENTAS DEL NEGOCIO ---
app.get('/sales', authenticateToken, async (req: any, res: any) => {
  const { businessId } = req.user;

  try {
    const sales = await prisma.sale.findMany({
      where: { businessId },
      include: {
        items: {
          include: {
            variation: {
              include: {
                product: { include: { category: true } }
              }
            }
          }
        },
        user: { select: { fullName: true, email: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error listando ventas" });
  }
});

// --- OBTENER UNA VENTA ESPECÍFICA ---
app.get('/sales/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const { businessId } = req.user;

  try {
    const sale = await prisma.sale.findFirst({
      where: { id: Number(id), businessId },
      include: {
        items: {
          include: {
            variation: {
              include: {
                product: { include: { category: true } }
              }
            }
          }
        },
        user: { select: { fullName: true, email: true } }
      }
    });

    if (!sale) return res.status(404).json({ error: "Venta no encontrada" });

    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo venta" });
  }
});

// --- 1. REGISTRO DE NUEVA EMPRESA (Onboarding) ---
app.post('/auth/register', async (req, res) => {
  // Generamos un ID aleatorio para rastrear ESTA petición
  const reqId = Math.floor(Math.random() * 10000); 
  console.log(`[${reqId}] 🟢 INICIO Petición Register: ${req.body.email}`);

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

    // Si llegamos aquí, ES IMPOSIBLE que salte al catch
    const token = jwt.sign({ id: result.user.id, businessId: result.business.id }, SECRET_KEY);
    
    console.log(`[${reqId}] ✅ ÉXITO: Usuario creado.`);
    return res.json({ success: true, token, user: result.user });

  } catch (error: any) {
    console.log(`[${reqId}] ❌ ERROR en Catch ${error}`); // Veremos si es el mismo ID o uno nuevo
    
    if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Correo duplicado' });
    }
    return res.status(500).json({ error: "Server error" });
  }
});
// --- AGREGAR EMPLEADO ---
app.post('/users/add', authenticateToken, async (req: any, res: any) => {
  const { fullName, email, password } = req.body;
  const { businessId } = req.user;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newEmployee = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashedPassword,
        role: 'SELLER',
        businessId: businessId
      }
    });

    res.json({ success: true, message: "Empleado creado", employee: newEmployee });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Email ya registrado" });
    }
    res.status(500).json({ error: "Error creando empleado" });
  }
});

// --- LISTAR EQUIPO DEL NEGOCIO ---
app.get('/users', authenticateToken, async (req: any, res: any) => {
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

app.get('/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id; // Usuario autenticado del token

    // Fechas para filtrar
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día de hoy

    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // 1. Calcular Ingresos de HOY
    const revenueAggToday = await prisma.sale.aggregate({
      where: { 
        userId,
        date: {
          gte: today,
          lt: tomorrowStart
        }
      },
      _sum: { total: true }
    });
    const totalRevenueToday = revenueAggToday._sum.total || 0;

    // 2. Buscar el ÚLTIMO DÍA ANTERIOR CON VENTAS
    const lastSaleBeforeToday = await prisma.sale.findFirst({
      where: {
        userId,
        date: {
          lt: today // Todas las ventas antes de hoy
        }
      },
      orderBy: { date: 'desc' }, // Ordenar por fecha descendente
      select: { date: true }
    });

    let growth = "+0%";
    if (lastSaleBeforeToday) {
      // Obtener todas las ventas del último día con ventas
      const lastSaleDate = new Date(lastSaleBeforeToday.date);
      lastSaleDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(lastSaleDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const revenueAggLastSaleDay = await prisma.sale.aggregate({
        where: {
          userId,
          date: {
            gte: lastSaleDate,
            lt: nextDay
          }
        },
        _sum: { total: true }
      });
      const totalRevenueLastSaleDay = revenueAggLastSaleDay._sum.total || 0;

      // Calcular Growth (%)
      if (totalRevenueLastSaleDay === 0) {
        growth = totalRevenueToday > 0 ? "+100%" : "+0%";
      } else {
        const percentageChange = ((totalRevenueToday - totalRevenueLastSaleDay) / totalRevenueLastSaleDay) * 100;
        const sign = percentageChange >= 0 ? "+" : "";
        growth = `${sign}${Math.round(percentageChange)}%`;
      }
    } else {
      // No hay ventas anteriores, si hay ventas hoy es +100%
      growth = totalRevenueToday > 0 ? "+100%" : "+0%";
    }

    // 3. Obtener "Movimientos Recientes de HOY" (SaleItems)
    const recentItems = await prisma.saleItem.findMany({
      where: { 
        sale: { 
          userId,
          date: {
            gte: today,
            lt: tomorrowStart
          }
        }
      },
      take: 20,
      orderBy: { 
        sale: { date: 'desc' }
      },
      include: {
        sale: true,
        variation: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      }
    });

    // 4. Mapear datos para el Frontend
    const transactions = recentItems.map(item => {
      const product = item.variation.product;
      const category = product.category;

      return {
        id: item.id,
        title: `${product.name} (${item.variation.size})`, 
        status: ['Completado'], 
        category: category.name,
        iconKey: category.iconKey,
        qty: item.quantity,
        price: item.price, 
        date: item.sale.date,
        color: 'Blue',
        imageColor: 'bg-blue-50', 
        iconColor: 'text-blue-600'
      };
    });

    res.json({
      stats: {
        totalRevenue: totalRevenueToday,
        growth: growth
      },
      transactions: transactions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching dashboard' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
