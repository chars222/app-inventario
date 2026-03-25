import React, { useEffect, useState } from 'react';
import { Home, BarChart2, Plus, ShoppingCart, TrendingUp, LogOut, Package, User, Sparkles, ArrowRight, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Icons } from './components/Icons'; 
import StockModal from './components/StockModal';
import SaleModal from './components/SaleModal';
import AddProductModal from './components/AddProductModal';
import Register from './Register';
import Login from './Login';
import Reports from './Reports'; 
import {ProfileView} from './components/Profile'; // Tu nuevo componente de perfil separado
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

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

// ==========================================
// 🚀 MODO SHOWCASE (DEMO DE MARKETING)
// ==========================================
const DEMO_PRODUCTS: Product[] = [
  {
    id: 1, name: "Básica Cuello Redondo", price: 125, color: "Black", totalStock: 15,
    category: { name: "Poleras", iconKey: "Poleras", sizeType: "LETTER" },
    variations: [{ id: 1, size: "S", stock: 5 }, { id: 2, size: "M", stock: 10 }, { id: 3, size: "L", stock: 0 }]
  },
  {
    id: 2, name: "Camisa Oxford Blanca", price: 180, color: "White", totalStock: 10,
    category: { name: "Camisas", iconKey: "Camisas", sizeType: "LETTER" },
    variations: [{ id: 4, size: "M", stock: 5 }, { id: 5, size: "L", stock: 5 }]
  },
  {
    id: 3, name: "Jeans Premium Skinny", price: 250, color: "Navy", totalStock: 3, // Stock Crítico
    category: { name: "Pantalones", iconKey: "Pantalones", sizeType: "NUMERIC" },
    variations: [{ id: 6, size: "30", stock: 0 }, { id: 7, size: "32", stock: 2 }, { id: 8, size: "34", stock: 1 }]
  }
];

const AuthPromptModal = ({ isOpen, onClose, onAction }: { isOpen: boolean, onClose: () => void, onAction: (mode: 'login'|'register') => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
          <Sparkles size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2">¡Pasa al siguiente nivel!</h2>
        <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
          Estás en el modo de demostración. Crea tu cuenta gratuita para administrar tu propio inventario, registrar ventas reales y ver tus ganancias exactas.
        </p>
        <div className="space-y-3">
          <button onClick={() => onAction('register')} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95">
            Crear mi Empresa <ArrowRight size={18} />
          </button>
          <button onClick={() => onAction('login')} className="w-full bg-white border-2 border-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95">
            Ya tengo cuenta
          </button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2">✕</button>
      </div>
    </div>
  );
};

const ShowcaseApp = ({ onNavigateAuth }: { onNavigateAuth: (mode: 'login'|'register') => void }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports'>('dashboard');
  const [expandedDemo, setExpandedDemo] = useState<number | null>(1); // Expandir el primer reporte por defecto

  const groupedProducts = DEMO_PRODUCTS.reduce((acc, product) => {
    const catName = product.category.name;
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // ==========================================
  // REPORTE SIMULADO (INTERACTIVO) PARA DEMO
  // ==========================================
  if (currentView === 'reports') {
    return (
      <div className="min-h-screen bg-[#F4F6F9] pb-32">
        <div className="pt-8 px-5 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Utilidades Demo</h1>
            <p className="text-sm text-slate-500 mt-1">Así analizaremos tu negocio real.</p>
          </div>
          <button onClick={() => setShowPrompt(true)} className="text-xs font-bold bg-white border border-slate-200 text-blue-600 px-3 py-2 rounded-xl shadow-sm hover:bg-blue-50 active:scale-95 transition-all">
            Exportar CSV
          </button>
        </div>

        <div className="px-5 space-y-4">
          
          {/* KPIs EXACTAMENTE COMO EL REAL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a202c] p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos</p>
              <p className="text-2xl font-black text-white leading-none mt-1">Bs 12,450</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">142 ventas</p>
            </div>
            <div className="bg-[#fff1f2] p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400/80">Costo Total</p>
              <p className="text-2xl font-black text-[#881337] leading-none mt-1">Bs 7,650</p>
            </div>
            <div className="bg-[#10b981] p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80">Utilidad Neta</p>
              <p className="text-2xl font-black text-white leading-none mt-1">Bs 4,800</p>
            </div>
            <div className="bg-[#eff6ff] p-4 rounded-2xl flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">Margen</p>
              <p className="text-2xl font-black text-[#1e3a8a] leading-none mt-1">38.5%</p>
              <p className="text-[10px] font-bold text-blue-400 mt-1">185 unidades vendidas</p>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mt-6">Utilidad por producto</p>

          {/* ITEM SIMULADO 1 */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
            <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpandedDemo(expandedDemo === 1 ? null : 1)}>
              <div className="w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 bg-white">
                <Package size={24} className="text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-[15px] truncate">Básica Cuello Redondo</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">
                  Bs 2,800 utilidad <span className="opacity-50">·</span> 42.0%
                </p>
              </div>
              <div className="flex flex-col items-center justify-center shrink-0 mr-1">
                <p className="text-lg font-black text-slate-800 leading-none">60</p>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1">UDS</p>
              </div>
              <div className="shrink-0 text-slate-300">
                {expandedDemo === 1 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>
            
            {expandedDemo === 1 && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-[#f8fafc] rounded-2xl p-2.5 text-center flex flex-col justify-center border border-slate-100/50">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Ingreso</p>
                    <p className="font-black text-slate-800 text-sm">Bs 6,666</p>
                  </div>
                  <div className="bg-[#fff1f2] rounded-2xl p-2.5 text-center flex flex-col justify-center border border-red-50">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-0.5">Costo</p>
                    <p className="font-black text-[#9f1239] text-sm">Bs 3,866</p>
                  </div>
                  <div className="bg-[#ecfdf5] rounded-2xl p-2.5 text-center flex flex-col justify-center border border-emerald-50">
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-0.5">Utilidad</p>
                    <p className="font-black text-[#047857] text-sm">Bs 2,800</p>
                  </div>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Por Talla</p>
                <div className="space-y-3 bg-[#f8fafc] border border-slate-100/50 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-sm font-black text-slate-700 text-center">M</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-end text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">40 uds vendidas <span className="mx-1 opacity-50">·</span> Bs 4,444</span>
                        <span className="text-emerald-600 font-black">+Bs 1,866</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-[#fca5a5]">
                        <div className="bg-[#34d399] h-full rounded-full" style={{ width: `42%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-sm font-black text-slate-700 text-center">S</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-end text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">20 uds vendidas <span className="mx-1 opacity-50">·</span> Bs 2,222</span>
                        <span className="text-emerald-600 font-black">+Bs 934</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-[#fca5a5]">
                        <div className="bg-[#34d399] h-full rounded-full" style={{ width: `42%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ITEM SIMULADO 2 */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
            <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpandedDemo(expandedDemo === 2 ? null : 2)}>
              <div className="w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 bg-white">
                <Package size={24} className="text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-[15px] truncate">Camisa Oxford Blanca</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">
                  Bs 2,000 utilidad <span className="opacity-50">·</span> 35.0%
                </p>
              </div>
              <div className="flex flex-col items-center justify-center shrink-0 mr-1">
                <p className="text-lg font-black text-slate-800 leading-none">25</p>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1">UDS</p>
              </div>
              <div className="shrink-0 text-slate-300">
                {expandedDemo === 2 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>
            
            {expandedDemo === 2 && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-[#f8fafc] rounded-2xl p-2.5 text-center flex flex-col justify-center border border-slate-100/50">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Ingreso</p>
                    <p className="font-black text-slate-800 text-sm">Bs 5,714</p>
                  </div>
                  <div className="bg-[#fff1f2] rounded-2xl p-2.5 text-center flex flex-col justify-center border border-red-50">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-0.5">Costo</p>
                    <p className="font-black text-[#9f1239] text-sm">Bs 3,714</p>
                  </div>
                  <div className="bg-[#ecfdf5] rounded-2xl p-2.5 text-center flex flex-col justify-center border border-emerald-50">
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-0.5">Utilidad</p>
                    <p className="font-black text-[#047857] text-sm">Bs 2,000</p>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Por Talla</p>
                <div className="space-y-3 bg-[#f8fafc] border border-slate-100/50 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-sm font-black text-slate-700 text-center">L</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-end text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">25 uds vendidas <span className="mx-1 opacity-50">·</span> Bs 5,714</span>
                        <span className="text-emerald-600 font-black">+Bs 2,000</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-[#fca5a5]">
                        <div className="bg-[#34d399] h-full rounded-full" style={{ width: `35%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA BANNER: Invitar a registrarse */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-center shadow-lg shadow-blue-500/30 mt-6 cursor-pointer relative overflow-hidden" onClick={() => setShowPrompt(true)}>
             <div className="relative z-10">
               <Sparkles className="mx-auto text-blue-200 mb-3" size={32} />
               <h3 className="font-black text-white text-xl">¿Quieres ver tus propios números?</h3>
               <p className="text-sm text-blue-100 mt-2 mb-4">Crea tu cuenta gratis y obtén reportes en tiempo real, control de stock y exportación a Excel.</p>
               <button className="bg-white text-blue-700 px-6 py-3 rounded-xl font-black shadow-md w-full active:scale-95 transition-all">Crear mi Empresa Ahora</button>
             </div>
             <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl opacity-10 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Navbar */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40">
          <div className="w-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex gap-6 items-center">
            <button onClick={() => setCurrentView('dashboard')} className="p-2 text-slate-400 hover:text-slate-700"><Home size={26} strokeWidth={2.5} /></button>
            <button className="p-2 text-blue-600"><BarChart2 size={26} strokeWidth={2.5} /></button>
            <button onClick={() => setShowPrompt(true)} className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white"><Plus size={24} /></button>
            <button onClick={() => setShowPrompt(true)} className="p-2 text-slate-400 hover:text-slate-700"><User size={26} strokeWidth={2.5} /></button>
          </div>
        </div>
        <AuthPromptModal isOpen={showPrompt} onClose={() => setShowPrompt(false)} onAction={onNavigateAuth} />
      </div>
    )
  }

  // ==========================================
  // DASHBOARD SIMULADO (INTERACTIVO) PARA DEMO
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md relative pb-32">
        
        {/* BANNER MODO DEMO */}
        <div className="bg-indigo-600 text-white text-center text-[10px] font-black uppercase tracking-widest py-1.5 flex justify-center items-center gap-2">
           <Sparkles size={12} /> Estás viendo una demostración <Sparkles size={12} />
        </div>

        <div className="pt-6 px-5 mb-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/60 relative overflow-hidden cursor-pointer" onClick={() => setShowPrompt(true)}>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tu Futura Empresa</h2>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">Admin Demo</span>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight text-[#1E293B]">Bs 12,450</span>
                    <div className="flex items-center text-emerald-500 font-bold text-xs mb-2 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp size={14} className="mr-1" strokeWidth={3} /> +18%
                    </div>
                </div>
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
          </div>
        </div>

        <div className="px-5 mb-4 flex justify-between items-end">
            <h2 className="text-lg font-black text-[#1E293B]">Inventario Activo</h2>
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">Ejemplos</span>
        </div>

        <div className="px-5 space-y-6">
          {Object.entries(groupedProducts).map(([categoryName, catProducts]) => (
            <div key={categoryName}>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">{categoryName}</h3>
              <div className="space-y-3">
                {catProducts.map((item) => {
                  const IconComponent = (Icons as Record<string, any>)[item.category.iconKey] || Package;
                  const colorClass = PRODUCT_COLORS[item.color] || PRODUCT_COLORS.Blue;
                  return (
                    <div key={item.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                          <IconComponent size={40}  strokeWidth={1.5} /> 
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#1E293B] text-[15px] leading-tight truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock</span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-black">{item.totalStock}</span>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ml-auto">Bs {item.price}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {item.variations.map((v) => (
                            <div key={v.id} className="flex items-center text-[10px] font-bold border border-slate-100 rounded-md bg-slate-50 overflow-hidden shadow-sm">
                              <span className="px-1.5 py-0.5 text-slate-600 bg-slate-100/50">{v.size}</span>
                              <span className={`px-1.5 py-0.5 ${v.stock === 0 ? 'bg-red-50 text-red-600 border-l border-red-100' : 'bg-white text-slate-500 border-l border-slate-100'}`}>{v.stock}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 border-l border-slate-50 pl-3">
                        {/* BOTONES FALSOS QUE ABREN EL MODAL DE REGISTRO */}
                        <button onClick={() => setShowPrompt(true)} className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center hover:bg-[#34d399] transition-colors border border-[#d1fae5]">
                          <Plus size={20} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => setShowPrompt(true)} className="w-10 h-10 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center hover:bg-[#3b82f6] transition-colors border border-[#dbeafe]">
                          <ShoppingCart size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="w-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex gap-6 items-center pointer-events-auto">
              <button className="p-2 text-blue-600"><Home size={26} strokeWidth={2.5} /></button>
              <button onClick={() => setCurrentView('reports')} className="p-2 text-slate-400 hover:text-slate-700"><BarChart2 size={26} strokeWidth={2.5} /></button>
              <button onClick={() => setShowPrompt(true)} className="w-12 h-12 bg-slate-900 hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 mx-2">
                <Plus size={24} />
              </button>
              <button onClick={() => setShowPrompt(true)} className="p-2 text-slate-400 hover:text-slate-700"><User size={26} strokeWidth={2.5} /></button>
            </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F4F6F9] to-transparent pointer-events-none z-10" />
      </div>

      <AuthPromptModal isOpen={showPrompt} onClose={() => setShowPrompt(false)} onAction={onNavigateAuth} />
    </div>
  );
};


// ==========================================
// APLICACIÓN REAL PROTEGIDA
// ==========================================
const MainApp = () => {
  const { user, token, logout, isLoading } = useAuth();
  
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

  const isOwner = user?.role === 'OWNER'; 

  const fetchData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const resCats = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` }});
      if (resCats.ok) setCategories(await resCats.json());

      const resProds = await fetch(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` }});
      if (resProds.ok) setProducts(await resProds.json());

      const resStats = await fetch(`${API_URL}/dashboard`, { headers: { Authorization: `Bearer ${token}` }});
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
    if (user && token) fetchData();
  }, [user, token]);

  const groupedProducts = products.reduce((acc, product) => {
    const catName = product.category.name;
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

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

  // Rutas de Navegación Interna (Solo para usuarios reales)
  if (currentView === 'reports') return <Reports token={token!} user={user} onBack={() => setCurrentView('dashboard')} />;
  if (currentView === 'profile') return <ProfileView token={token!} user={user} onBack={() => setCurrentView('dashboard')} logout={logout} />;

  if (loadingData && products.length === 0) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Cargando CENTRAL...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md relative pb-32">
        <div className="pt-8 px-5 mb-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/60 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user?.businessName || 'Empresa'}</h2>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold truncate max-w-[120px]">{user?.fullName || 'Usuario'}</span>
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
                      <div className={`w-[52px] h-[52px] rounded-2xl border border-slate-200 ${colorClass} flex items-center justify-center shrink-0`}>
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

        {/* NAVEGACIÓN INFERIOR REDISEÑADA */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="w-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex gap-6 items-center pointer-events-auto">
              
              <button onClick={() => setCurrentView('dashboard')} className="p-2 transition-colors text-blue-600">
                <Home size={26} strokeWidth={2.5} />
              </button>

              <button onClick={() => setCurrentView('reports')} className="p-2 transition-colors text-slate-400 hover:text-slate-700">
                <BarChart2 size={26} strokeWidth={2.5} />
              </button>

              {isOwner && (
                <button onClick={() => setIsAddProductOpen(true)} className="w-12 h-12 bg-slate-900 hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 mx-2">
                  <Plus size={24} />
                </button>
              )}

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


// ==========================================
// ENRUTADOR PRINCIPAL (Maneja la lógica de vistas y Auth)
// ==========================================
const AppRouter = () => {
  const { user, isLoading } = useAuth();
  
  // Modos de Autenticación cuando NO hay usuario logueado
  const [authMode, setAuthMode] = useState<'demo' | 'login' | 'register'>('demo');

  if (isLoading) return <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center font-bold text-slate-400">Verificando sesión...</div>;

  // 1. SI NO HAY USUARIO LOGUEADO
  if (!user) {
    if (authMode === 'login') {
      return (
        <div className="relative">
          <button onClick={() => setAuthMode('demo')} className="absolute top-6 left-5 z-50 p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-500">
            <ArrowLeft size={20}/>
          </button>
          <Login />
          <button onClick={() => setAuthMode('register')} className="fixed bottom-6 left-0 right-0 text-center text-sm font-bold text-slate-500 underline hover:text-slate-800 z-50">
              ¿No tienes cuenta? Crea tu Empresa
          </button>
        </div>
      );
    }

    if (authMode === 'register') {
      return (
        <div className="relative">
          <button onClick={() => setAuthMode('demo')} className="absolute top-6 left-5 z-50 p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-500">
            <ArrowLeft size={20}/>
          </button>
          <Register />
          <button onClick={() => setAuthMode('login')} className="fixed bottom-6 left-0 right-0 text-center text-sm font-bold text-slate-500 underline hover:text-slate-800 z-50">
              ¿Ya tienes cuenta? Inicia Sesión
          </button>
        </div>
      );
    }

    // POR DEFECTO: Muestra la pantalla Demo (El Showcase)
    return <ShowcaseApp onNavigateAuth={setAuthMode} />;
  }

  // 2. SI HAY USUARIO: Muestra la App Real
  return <MainApp />;
};

// Componente Raíz que envuelve todo en el AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}