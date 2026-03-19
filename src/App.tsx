import React, { useEffect, useState } from 'react';
import { Home, BarChart2, Plus, ShoppingCart, Check, Package, TrendingUp, X, LogOut } from 'lucide-react';
import { Icons } from './components/Icons';
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

// TU IP LOCAL (Asegúrate que sea la correcta de tu PC)
const API_URL = 'http://192.168.0.9:3000';

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
// 1. MODALES (Sin cambios en lógica UI)
// ==========================================
const StockModal = ({ isOpen, onClose, product, onConfirm }: any) => {
  if (!isOpen || !product) return null;
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  const IconComponent = Icons[product.category.iconKey as keyof typeof Icons] || Icons.Poleras;
  const currentScale = SIZE_SCALES[product.category.sizeType] || SIZE_SCALES['LETTER'];

  const handleSubmit = () => {
    if (!size) {
        setError('⚠️ ¡Selecciona una talla primero!');
        return;
    }
    onConfirm(product.id, size, qty, newPrice);
    setError(''); setNewPrice(''); setSize(''); onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X size={20} /></button>
        <h3 className="text-xl font-bold text-slate-800 mb-6">Reponer Stock</h3>
        
        <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
            <IconComponent size={28} />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{product.name}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">Stock Total: {product.totalStock}</p>
          </div>
        </div>

        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talla</label>
                {error && <span className="text-xs font-bold text-red-500 animate-pulse">{error}</span>}
            </div>
            <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${error ? 'p-1 bg-red-50 rounded-xl border border-red-100' : ''}`}>
                {currentScale.map((s) => {
                    const existingVar = product.variations.find((v: any) => v.size === s);
                    const currentStock = existingVar ? existingVar.stock : 0;
                    const hasStock = currentStock > 0;
                    return (
                        <button key={s} onClick={() => { setSize(s); setError(''); }}
                            className={`relative px-4 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap border-2 flex flex-col items-center min-w-[60px] ${
                                size === s ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105 z-10' : hasStock ? 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-400' : 'bg-white text-slate-300 border-slate-100 hover:border-slate-300'
                            }`}
                        >
                            <span className="text-sm">{s}</span>
                            {hasStock && size !== s && <span className="text-[10px] font-normal mt-0.5 opacity-80">{currentStock}</span>}
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="flex gap-4 mb-8">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cantidad</label>
                <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold text-slate-500">-</button>
                    <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full text-center font-bold text-slate-800 bg-transparent outline-none" />
                    <button onClick={() => setQty(qty + 1)} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold text-slate-500">+</button>
                </div>
            </div>
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nuevo Precio</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">Bs</span>
                    <input type="number" placeholder={String(product.price)} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 pl-8 font-bold text-slate-800 outline-none" />
                </div>
            </div>
        </div>

        <button onClick={handleSubmit} className={`w-full py-4 font-bold rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${size ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          <Plus size={24} strokeWidth={3} /> {size ? 'Confirmar Ingreso' : 'Elige una talla'}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE: MODAL DE CREAR PRODUCTO
// ==========================================
const AddProductModal = ({ isOpen, onClose, onConfirm, categories }: any) => {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: null as number | null,
    color: 'Blue' // Color por defecto
  });
  
  const [activeCategory, setActiveCategory] = useState<any>(null);

  // Cuando cambias la categoría, actualizamos el icono visual
  const handleCategorySelect = (cat: any) => {
    setForm({ ...form, categoryId: cat.id });
    setActiveCategory(cat);
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.categoryId) return; // Validación simple
    onConfirm(form);
    onClose();
    // Reset form
    setForm({ name: '', price: '', categoryId: null, color: 'Blue' });
    setActiveCategory(null);
  };

  // Icono de Previsualización (Dinámico)
  const PreviewIcon = activeCategory 
    ? Icons[activeCategory.iconKey as keyof typeof Icons] 
    : Icons.Poleras;
    
  const previewColorClass = PRODUCT_COLORS[form.color] || PRODUCT_COLORS['Blue'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] sm:p-4 animate-in fade-in duration-200">
      {/* Modal tipo "Bottom Sheet" en móvil, Centrado en PC */}
      <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl h-[90vh] sm:h-auto overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Crear Producto</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* 1. PREVISUALIZACIÓN (Icono Grande) */}
        <div className="flex justify-center mb-6">
            <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-300 ${previewColorClass}`}>
                <PreviewIcon size={64} />
            </div>
        </div>

        {/* 2. CAMPOS DE TEXTO */}
        <div className="space-y-4 mb-6">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Nombre del Producto</label>
                <input 
                    type="text" 
                    placeholder="Ej. Polera Estampada" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Precio Base (Bs)</label>
                <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                />
            </div>
        </div>

        {/* 3. SELECCIÓN DE CATEGORÍA (Horizontal Scroll) */}
        <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Categoría</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat: any) => {
                    const CatIcon = Icons[cat.iconKey as keyof typeof Icons] || Icons.Poleras;
                    const isActive = form.categoryId === cat.id;
                    return (
                        <button 
                            key={cat.id} 
                            onClick={() => handleCategorySelect(cat)}
                            className={`flex flex-col items-center gap-2 min-w-[70px] p-3 rounded-2xl border-2 transition-all ${
                                isActive 
                                ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                : 'border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                        >
                            <CatIcon size={24} />
                            <span className="text-[10px] font-bold truncate w-full text-center">{cat.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* 4. SELECCIÓN DE COLOR */}
        <div className="mb-8">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Color Principal</label>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {Object.keys(PRODUCT_COLORS).map((colorKey) => {
                     // Extraemos el color de fondo de la clase de Tailwind (truco visual)
                     // En un caso real, podrías tener un mapa de códigos hex.
                     // Aquí simularemos colores visuales para los botones
                     const bgMap: Record<string, string> = {
                        'Blue': 'bg-blue-500', 'Navy': 'bg-indigo-900', 'Red': 'bg-red-500', 
                        'Black': 'bg-slate-900', 'White': 'bg-white border border-slate-200', 'Green': 'bg-emerald-500'
                     };
                     
                     const isSelected = form.color === colorKey;

                     return (
                        <button
                            key={colorKey}
                            onClick={() => setForm({...form, color: colorKey})}
                            className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-transform ${bgMap[colorKey]} ${isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        >
                            {isSelected && <Check size={16} className={colorKey === 'White' ? 'text-slate-900' : 'text-white'} strokeWidth={3} />}
                        </button>
                     );
                })}
            </div>
        </div>

        <button 
            onClick={handleSubmit} 
            disabled={!form.categoryId || !form.name}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Crear Producto
        </button>
      </div>
    </div>
  );
};

const SaleModal = ({ isOpen, onClose, product, onConfirm }: any) => {
  if (!isOpen || !product) return null;
  const availableVariations = product.variations.filter((v: any) => v.stock > 0);
  const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
  const [price, setPrice] = useState(product.price);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(''); 

  useEffect(() => {
    if (availableVariations.length > 0) setSelectedVarId(availableVariations[0].id);
    setPrice(product.price);
    setQty(1);
  }, [product]);

  const handleSubmit = () => {
    if (selectedVarId) {
        onConfirm([{ variationId: selectedVarId, quantity: qty, price: Number(price) }]);
        onClose();
    } else {
        setError('⚠️ Selecciona Talla');
    }
  };

  const IconComponent = Icons[product.category.iconKey as keyof typeof Icons] || Icons.Poleras;
  const colorClasses = PRODUCT_COLORS[product.color] || PRODUCT_COLORS['Blue'];

  if (availableVariations.length === 0) return (
     <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white p-8 rounded-[2rem] text-center max-w-xs shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Package size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¡Sin Stock!</h3>
            <p className="text-slate-500 mb-6 text-sm">No quedan tallas disponibles.</p>
            <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Entendido</button>
        </div>
     </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Nueva Venta</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X size={20}/></button>
        </div>
        <div className="flex justify-center mb-6">
           <div className={`w-32 h-32 rounded-full flex items-center justify-center ${colorClasses} relative`}>
              <IconComponent size={82} />
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">x{qty}</div>
           </div>
        </div>
        <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Selecciona Talla</label>
            {error && <p className="text-red-500 text-xs font-bold mb-1">{error}</p>}
            <div className="flex gap-2 flex-wrap">
                {availableVariations.map((v: any) => (
                    <button key={v.id} onClick={() => {setSelectedVarId(v.id); setError('')}} className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${selectedVarId === v.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                        {v.size} <span className="text-[10px] font-normal opacity-60 ml-1">({v.stock})</span>
                    </button>
                ))}
            </div>
        </div>
        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-slate-400 uppercase">Precio</label><span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Editable</span></div>
            <div className="flex items-center"><span className="text-2xl font-bold text-slate-400 mr-2">Bs</span><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-transparent text-4xl font-black text-slate-800 outline-none"/></div>
        </div>
        <button onClick={handleSubmit} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"><Check size={24} strokeWidth={3} /> Confirmar Venta</button>
      </div>
    </div>
  );
};

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
      if (resCats.ok) setCategories(await resCats.json());

      // B. Cargar Productos (Existente)
      const resProds = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resProds.ok) setProducts(await resProds.json());

      // 2. Cargar Stats (Opcional, si tienes el endpoint)
      /* const resStats = await fetch(`${API_URL}/dashboard`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStats = await resStats.json();
      setTotalRevenue(dataStats.stats?.totalRevenue || 0);
      */
      
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
                        <TrendingUp size={14} className="mr-1" strokeWidth={3} /> +15%
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