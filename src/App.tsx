import React, { useEffect, useState } from 'react';
import { Home, BarChart2, Plus, ShoppingCart, TrendingUp, LogOut } from 'lucide-react';
import { Icons } from './components/Icons';
import StockModal from './components/StockModal';
import SaleModal from './components/SaleModal';
import AddProductModal from './components/AddProductModal';
import Register from './Register';
import Login from './Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- TIPOS ---
interface BadgeProps {
  children: React.ReactNode;
  variant: string;
}

interface Variation {
  id: number;
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  category: { name: string; iconKey: string; sizeType: string }; 
  variations: Variation[];
  totalStock: number;
}

// API Configuration from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- CONSTANTES VISUALES ---
const SIZE_SCALES: Record<string, string[]> = {
  'LETTER': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'NUMERIC': ['36', '38', '40', '42', '44', '46', '48'],
  'SHOES': ['38', '39', '40', '41', '42', '43', '44']
};

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

// ==========================================
// COMPONENTES MODALES IMPORTADOS
// ==========================================
// Los modales ahora están en:
// - src/components/StockModal.tsx
// - src/components/SaleModal.tsx
// - src/components/AddProductModal.tsx

// ==========================================
// 4. MAIN APP (Lógica del Dashboard)
// ==========================================
const MainApp = () => {
  // AQUI ES DONDE USAMOS TU CODIGO NUEVO
  const { user, token, logout, isLoading } = useAuth();
  
  // Estado para alternar entre Login y Registro si no hay usuario
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados del Dashboard
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [growth, setGrowth] = useState("+0%");
  const [loadingData, setLoadingData] = useState(false);
  
  // Modales
  const [stockModalData, setStockModalData] = useState<Product | null>(null);
  const [saleModalData, setSaleModalData] = useState<Product | null>(null);

  const [categories, setCategories] = useState([]); // Para guardar las categorías
  const [isAddProductOpen, setIsAddProductOpen] = useState(false); // Para abrir el modal

  // --- CARGA DE DATOS (PROTEGIDA CON JWT) ---
  const fetchData = async () => {
    if (!token) return; // Si no hay token, no intentamos cargar
    setLoadingData(true);
    try {
      // A. Cargar Categorías (NUEVO)
      const resCats = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resCats.ok) {
        const catsData = await resCats.json();
        console.log('Categorías cargadas:', catsData);
        setCategories(catsData);
      }

      // B. Cargar Productos (Existente)
      const resProds = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resProds.ok) setProducts(await resProds.json());

      // C. Cargar Stats (Dashboard con Revenue y Growth)
      const resStats = await fetch(`${API_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setTotalRevenue(dataStats.stats?.totalRevenue || 0);
        setGrowth(dataStats.stats?.growth || "+0%");
      }
      
      setLoadingData(false);
    } catch (error) {
      console.error("Error cargando datos", error);
      setLoadingData(false);
    }
  };

  // Cargar datos al entrar o cambiar de usuario
  useEffect(() => {
    if (user && token) {
        fetchData();
    }
  }, [user, token]);

  // --- ACCIONES (PROTEGIDAS) ---
  const handleAddStock = async (productId: number, size: string, quantity: number, newPrice?: string) => {
    if (!token) return;
    await fetch(`${API_URL}/stock/add`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- LLAVE
        },
        body: JSON.stringify({ productId, size, quantity, newPrice, userId: user?.id })
    });
    fetchData(); 
  };

  const handleCreateSale = async (items: any[]) => {
    if (!token) return;
    await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- LLAVE
        },
        body: JSON.stringify({ items, userId: user?.id })
    });
    fetchData(); 
  };

  const handleCreateProduct = async (formData: any) => {
    if (!token) return;
    await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
    });
    fetchData(); // Recargar la lista para ver el nuevo producto
  };

  // --- RENDERIZADO CONDICIONAL ---

  // 1. Cargando Sesión
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Verificando sesión...</div>;

  // 2. No Logueado -> Mostrar Login o Registro
  if (!user) {
    if (isRegistering) {
        return (
            <div className="relative">
                <Register />
                <button onClick={() => setIsRegistering(false)} className="fixed bottom-6 left-0 right-0 text-center text-sm font-bold text-slate-500 underline">
                    ¿Ya tienes cuenta? Inicia Sesión
                </button>
            </div>
        );
    }
    return (
        <div className="relative">
            <Login />
            <button onClick={() => setIsRegistering(true)} className="fixed bottom-6 left-0 right-0 text-center text-sm font-bold text-slate-500 underline">
                ¿No tienes cuenta? Crea tu Empresa
            </button>
        </div>
    );
  }

  // 3. Logueado -> Mostrar Dashboard
  if (loadingData && products.length === 0) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Cargando CENTRAL...</div>;

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md relative pb-32">
        
        {/* Header: Total Sales & Info Empresa */}
        <div className="pt-8 px-6 mb-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/60 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user.businessName}</h2>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">{user.fullName}</span>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight text-slate-900">
                        Bs {Number(totalRevenue).toLocaleString()}
                    </span>
                    <div className="flex items-center text-emerald-500 font-bold text-xs mb-2 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp size={14} className="mr-1" strokeWidth={3} /> {growth}
                    </div>
                </div>
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
          </div>
        </div>

        {/* Título de Sección */}
        <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-lg font-bold text-slate-800">Inventario Activo</h2>
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">{products.length} Items</span>
        </div>

        {/* Lista de Productos */}
        <div className="px-4 space-y-4">
          {products.map((item) => {
            const IconComponent = Icons[item.category.iconKey as keyof typeof Icons] || Icons.Poleras;
            const isLowStock = item.totalStock < 5;
            const colorClasses = PRODUCT_COLORS[item.color] || PRODUCT_COLORS['Blue'];
            
            return (
              <div key={item.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-white/60 flex items-center gap-4 transition-all hover:shadow-md">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${colorClasses}`}>
                    <IconComponent size={42} /> 
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase">Stock</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                        {item.totalStock}
                    </span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ml-auto">
                        Bs {item.price}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => setStockModalData(item)} className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm">
                    <Plus size={20} strokeWidth={3} />
                  </button>
                  <button onClick={() => setSaleModalData(item)} className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                    <ShoppingCart size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="w-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex gap-8 items-center pointer-events-auto">
              <button className="p-2 text-blue-600"><Home size={26} strokeWidth={2.5} /></button>
              
              {/* BOTÓN (+) CONECTADO */}
              <button 
                 onClick={() => setIsAddProductOpen(true)} // <--- AHORA ABRE EL MODAL
                 className="w-12 h-12 bg-slate-900 hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center text-white shadow-lg active:scale-95"
              >
                <Plus size={24} />
              </button>
              
              <button onClick={logout} className="p-2 text-red-400 hover:text-red-600"><LogOut size={26} /></button>
            </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F2F4F8] to-transparent pointer-events-none z-10" />
      </div>

      {/* Modales */}
      <StockModal isOpen={!!stockModalData} onClose={() => setStockModalData(null)} product={stockModalData} onConfirm={handleAddStock}  />
      <SaleModal isOpen={!!saleModalData} onClose={() => setSaleModalData(null)} product={saleModalData} onConfirm={handleCreateSale} />
      <AddProductModal 
        isOpen={isAddProductOpen} 
        onClose={() => setIsAddProductOpen(false)} 
        onConfirm={handleCreateProduct}
        categories={categories} // Le pasamos las categorías que cargamos
      />
    </div>
  );
};

// ==========================================
// 5. EXPORTACIÓN PRINCIPAL (Wrapper)
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}