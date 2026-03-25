import React, { useEffect, useState } from 'react';
import { Home, BarChart2, Plus, ShoppingCart, TrendingUp, LogOut, Package, User, UserPlus, ShieldAlert, Users, ArrowLeft } from 'lucide-react';
import { Icons } from './components/Icons'; // Asegúrate de que la ruta sea correcta
import StockModal from './components/StockModal';
import SaleModal from './components/SaleModal';
import AddProductModal from './components/AddProductModal';
import Register from './Register';
import Login from './Login';
import Reports from './Reports'; 
import {ProfileView} from './components/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- TIPOS ---
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
const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000'; // Ajusta a tu IP

// ==========================================
// LÓGICA PRINCIPAL DEL DASHBOARD
// ==========================================
const MainApp = () => {
  const { user, token, logout, isLoading } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'profile'>('dashboard');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [growth, setGrowth] = useState("+0%");
  const [loadingData, setLoadingData] = useState(false);
  
  // Estado de Modales
  const [stockModalData, setStockModalData] = useState<Product | null>(null);
  const [saleModalData, setSaleModalData] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const isOwner = user?.role === 'OWNER'; // Variable clave de permisos

  // --- CARGA DE DATOS (PROTEGIDA CON JWT) ---
  const fetchData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const resCats = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resCats.ok) setCategories(await resCats.json());

      const resProds = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resProds.ok) setProducts(await resProds.json());

      const resStats = await fetch(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    if (user && token) {
        fetchData();
    }
  }, [user, token]);

  // --- AGRUPAR PRODUCTOS POR CATEGORÍA ---
  const groupedProducts = products.reduce((acc, product) => {
    const catName = product.category.name;
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // --- ACCIONES CON EL BACKEND ---
  const handleAddStock = async (productId: number, size: string, quantity: number, newPrice?: string) => {
    if (!token) return;
    await fetch(`${API_URL}/stock/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId, size, quantity, newPrice, userId: user?.id })
    });
    fetchData(); 
  };

  const handleCreateSale = async (items: any[]) => {
    if (!token) return;
    await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items, userId: user?.id })
    });
    fetchData(); 
  };

  const handleCreateProduct = async (formData: any) => {
    if (!token) return;
    await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
    });
    fetchData();
  };

  // --- RENDERIZADO CONDICIONAL ---
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Verificando sesión...</div>;

  if (!user) {
    if (isRegistering) {
        return (
            <div className="relative">
                <Register />
                <button onClick={() => setIsRegistering(false)} className="fixed bottom-6 left-0 right-0 text-center text-sm font-bold text-slate-500 underline hover:text-slate-800">
                    ¿Ya tienes cuenta? Inicia Sesión
                </button>
            </div>
        );
    }
    return (
        <div className="relative">
            <Login />
            <button onClick={() => setIsRegistering(true)} className="fixed bottom-6 left-0 right-0 text-center text-sm font-bold text-slate-500 underline hover:text-slate-800">
                ¿No tienes cuenta? Crea tu Empresa
            </button>
        </div>
    );
  }

  // Rutas de Navegación Interna (Si entra aquí, retorna la vista completa y NO ejecuta el código del Footer)
  if (currentView === 'reports') return <Reports token={token!} user={user} onBack={() => setCurrentView('dashboard')} />;
  if (currentView === 'profile') return <ProfileView token={token!} user={user} onBack={() => setCurrentView('dashboard')} logout={logout} />;

  // A partir de aquí, TypeScript SABE que currentView === 'dashboard'
  if (loadingData && products.length === 0) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Cargando CENTRAL...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md relative pb-32">
        
        {/* HEADER: Info Empresa & Ventas */}
        <div className="pt-8 px-5 mb-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/60 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user.businessName}</h2>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold truncate max-w-[120px]">{user.fullName}</span>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight text-[#1E293B]">
                        Bs {Number(totalRevenue).toLocaleString()}
                    </span>
                    <div className="flex items-center text-emerald-500 font-bold text-xs mb-2 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp size={14} className="mr-1" strokeWidth={3} /> {growth}
                    </div>
                </div>
                {!isOwner && <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Ventas de tu turno (Hoy)</p>}
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
          </div>
        </div>

        <div className="px-5 mb-4 flex justify-between items-end">
            <h2 className="text-lg font-black text-[#1E293B]">Inventario Activo</h2>
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">{products.length} Items</span>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="px-5 space-y-6">
          {Object.entries(groupedProducts).map(([categoryName, catProducts]) => (
            <div key={categoryName}>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">
                {categoryName}
              </h3>
              
              <div className="space-y-3">
                {catProducts.map((item) => {
                  const IconComponent = (Icons as Record<string, any>)[item.category.iconKey] || Package;
                  const colorClass = PRODUCT_COLORS[item.color] || PRODUCT_COLORS.Blue;
                  
                  return (
                    <div key={item.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                          <IconComponent size={40} strokeWidth={1.5} /> 
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#1E293B] text-[15px] leading-tight truncate">{item.name}</h3>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock</span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-black">
                              {item.totalStock}
                          </span>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ml-auto">
                              Bs {item.price}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {item.variations.map((v) => (
                            <div key={v.id} className="flex items-center text-[10px] font-bold border border-slate-100 rounded-md bg-slate-50 overflow-hidden shadow-sm">
                              <span className="px-1.5 py-0.5 text-slate-600 bg-slate-100/50">{v.size}</span>
                              <span className={`px-1.5 py-0.5 ${v.stock === 0 ? 'bg-red-50 text-red-600 border-l border-red-100' : 'bg-white text-slate-500 border-l border-slate-100'}`}>
                                {v.stock}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 border-l border-slate-50 pl-3">
                        <button onClick={() => setStockModalData(item)} className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center hover:bg-[#34d399] hover:text-white transition-colors active:scale-95 border border-[#d1fae5]">
                          <Plus size={20} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => setSaleModalData(item)} className="w-10 h-10 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center hover:bg-[#3b82f6] hover:text-white transition-colors active:scale-95 border border-[#dbeafe]">
                          <ShoppingCart size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {products.length === 0 && !loadingData && (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 border-dashed">
                  <Package size={48} className="mx-auto text-slate-200 mb-3" />
                  <p className="font-bold text-slate-500">Tu inventario está vacío</p>
                  {isOwner ? (
                      <p className="text-xs text-slate-400 mt-1">Presiona el botón (+) abajo para crear tu primer producto.</p>
                  ) : (
                      <p className="text-xs text-slate-400 mt-1">El administrador aún no ha agregado productos.</p>
                  )}
              </div>
          )}
        </div>

        {/* NAVEGACIÓN INFERIOR REDISEÑADA (Sin condicionales de TypeScript que causen errores) */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="w-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex gap-6 items-center pointer-events-auto">
              
              {/* Al estar en este bloque, SIEMPRE estamos en el Dashboard, por lo que el botón Home siempre es azul */}
              <button onClick={() => setCurrentView('dashboard')} className="p-2 transition-colors text-blue-600">
                <Home size={26} strokeWidth={2.5} />
              </button>

              <button onClick={() => setCurrentView('reports')} className="p-2 transition-colors text-slate-400 hover:text-slate-700">
                <BarChart2 size={26} strokeWidth={2.5} />
              </button>

              {/* Botón Central: Agregar Producto (SOLO PARA DUEÑOS) */}
              {isOwner && (
                <button onClick={() => setIsAddProductOpen(true)} className="w-12 h-12 bg-slate-900 hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 mx-2">
                  <Plus size={24} />
                </button>
              )}

              {/* Botón de Perfil / Equipo */}
              <button onClick={() => setCurrentView('profile')} className="p-2 transition-colors text-slate-400 hover:text-slate-700">
                <User size={26} strokeWidth={2.5} />
              </button>

            </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F4F6F9] to-transparent pointer-events-none z-10" />
      </div>

      {/* MODALES */}
      <StockModal isOpen={!!stockModalData} onClose={() => setStockModalData(null)} product={stockModalData} onConfirm={handleAddStock} />
      <SaleModal isOpen={!!saleModalData} onClose={() => setSaleModalData(null)} product={saleModalData} onConfirm={handleCreateSale} />
      {isOwner && <AddProductModal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} onConfirm={handleCreateProduct} categories={categories} />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}