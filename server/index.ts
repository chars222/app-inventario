import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './prisma-client'; // Tu ruta personalizada

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "tu_secreto_super_seguro_cambialo_en_prod";

app.use(cors({
  origin: '*', // En producción, aquí pones 'https://tu-app.com'
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
        { name: 'Poleras', iconKey: 'Shirt', sizeType: 'LETTER' },
        { name: 'Camisas', iconKey: 'ButtonShirt', sizeType: 'LETTER' },
        { name: 'Chaquetas', iconKey: 'Jacket', sizeType: 'LETTER' },
        { name: 'Vestidos', iconKey: 'Dress', sizeType: 'LETTER' },
        // Ropa Inferior (Números)
        { name: 'Pantalones', iconKey: 'Pants', sizeType: 'NUMERIC' },
        { name: 'Jeans', iconKey: 'Pants', sizeType: 'NUMERIC' },
        { name: 'Shorts', iconKey: 'Pants', sizeType: 'NUMERIC' },
        // Calzado
        { name: 'Zapatos', iconKey: 'Shoes', sizeType: 'SHOES' }
      ]
    });

    // 3. CREAR EL NEGOCIO (Entidad Padre)
    const business = await prisma.business.create({
      data: {
        name: 'CENTRAL'
      }
    });

    // 4. CREAR USUARIO DUEÑO (Vinculado al Negocio)
    const user = await prisma.user.create({
      data: {
        email: 'demo@central.com',
        passwordHash: '123456',
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
  const { name, price, color, categoryId } = req.body;
  const { businessId, id: userId } = req.user; // Datos del Token

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        color,
        categoryId: Number(categoryId),
        businessId: businessId,   // Vinculado a tu empresa
        createdById: userId       // Vinculado a ti (Auditoría)
        // Nota: No creamos variaciones aquí, el stock empieza en 0
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
  const { businessId } = req.user.businessId; // <--- Ahora recibimos el ID del negocio

  if (!businessId) return res.status(400).json({ error: "Falta businessId" });

  const products = await prisma.product.findMany({
    where: { businessId: businessId },
    include: {
      category: true,
      variations: true
    },
    orderBy: { name: 'asc' }
  });

  // ... (el resto del mapeo sigue igual)
  const inventoryList = products.map(p => ({
     // ... tu lógica de mapeo
     id: p.id,
     name: p.name,
     price: p.price,
     color: p.color,
     totalStock: p.variations.reduce((sum, v) => sum + v.stock, 0),
     category: p.category,
     variations: p.variations
  }));

  res.json(inventoryList);
});

app.post('/stock/add', authenticateToken, async (req: any, res: any) => {
  const { productId, size, quantity, newPrice } = req.body;
  const userId = req.user.id;
  try {
    // Buscamos si ya existe esa talla para ese producto
    const variation = await prisma.variation.findFirst({
      where: { productId: Number(productId), size: String(size) }
    });

    if (variation) {
      // Si existe, actualizamos sumando
      await prisma.variation.update({
        where: { id: variation.id },
        data: { stock: { increment: Number(quantity) } }
      });
    } else {
      // Si no existe, la creamos
      await prisma.variation.create({
        data: {
          productId: Number(productId),
          size: String(size),
          stock: Number(quantity)
        }
      });
    }
    // B. Actualizar Precio (NUEVO: Si el usuario decidió cambiarlo)
      if (newPrice && Number(newPrice) > 0) {
        await prisma.product.update({
          where: { id: Number(productId) },
          data: { price: Number(newPrice) } // Esto actualiza el precio para TODO el stock
        });
      }

    res.json({ success: true, message: "Stock actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando inventario" });
  }
});


app.post('/sales', async (req, res) => {
  const { items } = req.body; 
  // items espera ser un array: [{ variationId, quantity, price }]

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalSale = 0;

      for (const item of items) {
        // 1. Verificamos stock disponible
        const variation = await tx.variation.findUnique({
          where: { id: item.variationId }
        });

        if (!variation || variation.stock < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ID ${item.variationId}`);
        }

        // 2. Descontamos Stock
        await tx.variation.update({
          where: { id: item.variationId },
          data: { stock: { decrement: item.quantity } }
        });

        // 3. Calculamos total acumulado
        totalSale += (item.price * item.quantity);
      }

      // 4. Creamos el registro de Venta y sus Detalles
      const user = await tx.user.findFirst();
      if (!user) throw new Error("No user found");

      const newSale = await tx.sale.create({
        data: {
          userId: user.id,
          businessId: user.businessId,
          total: totalSale,
          items: {
            create: items.map((item: any) => ({
              variationId: item.variationId,
              quantity: item.quantity,
              price: item.price // AQUÍ guardamos el precio editado/negociado
            }))
          }
        }
      });

      return newSale;
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
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
// --- 2. AGREGAR EMPLEADO (Solo el dueño debería poder) ---
app.post('/users/add', async (req, res) => {
  const { businessId, fullName, email, password } = req.body;

  try {
    const newEmployee = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: password,
        role: 'SELLER', // Rol de vendedor
        businessId: Number(businessId)
      }
    });

    res.json({ success: true, message: "Empleado creado", employee: newEmployee });
  } catch (error) {
    res.status(500).json({ error: "Error creando empleado" });
  }
});

// --- 3. LISTAR MI EQUIPO ---
app.get('/users/:businessId', async (req, res) => {
  const { businessId } = req.params;
  const users = await prisma.user.findMany({
    where: { businessId: Number(businessId) },
    select: { id: true, fullName: true, email: true, role: true } // No enviamos el password
  });
  res.json(users);
});

app.get('/dashboard', async (req, res) => {
  try {
    // 1. Obtener Usuario (Demo)
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ error: 'No user found' });

    // 2. Calcular Ingresos Totales (Sumar campo 'total' de todas las Sales)
    const revenueAgg = await prisma.sale.aggregate({
      where: { userId: user.id },
      _sum: { total: true }
    });
    const totalRevenue = revenueAgg._sum.total || 0;

    // 3. Obtener "Movimientos Recientes" (SaleItems)
    // Consultamos los ITEMS vendidos para mostrar fila por fila qué se vendió
    const recentItems = await prisma.saleItem.findMany({
      where: { 
        sale: { userId: user.id } // Filtrar por ventas de este usuario
      },
      take: 20, // Solo los últimos 20 movimientos
      orderBy: { 
        sale: { date: 'desc' } // Ordenar por fecha de la venta
      },
      include: {
        sale: true, // Para sacar la fecha
        variation: {
          include: {
            product: {
              include: { category: true } // Para sacar el icono y color
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
        // Título: Nombre del producto + Talla
        title: `${product.name} (${item.variation.size})`, 
        
        // Estado: Como ya no hay campo status, simulamos "Completado"
        status: ['Completado'], 
        
        category: category.name,
        iconKey: category.iconKey,
        
        // Cantidad y Precio de ESTE item específico
        qty: item.quantity,
        price: item.price, 
        
        // Fecha para mostrar cuándo fue (opcional si tu UI lo usa)
        date: item.sale.date,

        // Estilos visuales (Fallbacks)
        color: 'Blue', // Puedes agregar campo color a Product si quieres
        imageColor: 'bg-blue-50', 
        iconColor: 'text-blue-600'
      };
    });

    res.json({
      stats: {
        totalRevenue: totalRevenue,
        growth: "+15%" // Esto lo podrías calcular comparando mes actual vs anterior
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
