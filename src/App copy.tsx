import React, { useEffect, useState }from 'react';
import { Home, BarChart2, Plus, ShoppingCart, Check,Package,TrendingUp,X, Shirt,ShoppingBag } from 'lucide-react';
import { Icons } from './components/Icons';
import Register from './Register';
import Login from './Login';
import { AuthProvider, useAuth } from './context/AuthContext';

interface BadgeProps {
  children: React.ReactNode;
  variant: string;
}

interface Transaction {
  id: number;
  title: string;
  status: string[];
  qty: number;
  price: number;
  color: string;
  iconKey: string;
}

interface DashboardData {
  stats: {
    totalRevenue: number;
    growth: string;
  };
  transactions: Transaction[];
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

const API_URL = 'http://192.168.0.9:3000';

// Simulando datos basados en tu imagen
const transactions = [
  {
    id: 1,
    title: "Cotton T-shirt - Blue",
    status: ["Pending", "Paid"],
    qty: 150,
    price: 25,
    imageColor: "bg-blue-100",
    iconColor: "text-blue-600",
    variant: "blue"
  },
  {
    id: 2,
    title: "V-Neck Tee - White",
    status: ["Pending", "Paid"],
    qty: 150,
    price: 25,
    imageColor: "bg-gray-100",
    iconColor: "text-gray-500",
    variant: "white"
  },
  {
    id: 3,
    title: "V-Neck Tee - Red",
    status: ["Paid", "Paid"], // Replicando lo que se ve en la imagen (aunque parece un error del diseño original)
    qty: 150,
    price: 25,
    imageColor: "bg-red-100",
    iconColor: "text-red-600",
    variant: "red"
  },
  {
    id: 4,
    title: "Cotton T-shirt - Blrd",
    status: ["Pending"],
    qty: 150,
    price: 25,
    imageColor: "bg-red-100",
    iconColor: "text-red-700",
    variant: "dark-red"
  }
];

// --- SISTEMAS DE TALLAS ---
const SIZE_SCALES: Record<string, string[]> = {
  'LETTER': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'NUMERIC': ['36', '38', '40', '42', '44', '46', '48'], // Escala de Pantalones
  'SHOES': ['38', '39', '40', '41', '42', '43', '44']    // Escala de Zapatos
};

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100', // Borde para que se note
  'Green': 'text-emerald-600 bg-emerald-50',
};

const categoryIcons: Record<string, React.FC<any>> = {
  'Shirt': Icons.Poleras,
  'Layers': Icons.Pantalones,
  'Jacket': Icons.Chaquetas,
  'Briefcase': Icons.Chaquetas
};

// Componente Badge estilo shadcn/ui
const Badge = ({ children, variant }: BadgeProps) => {
  const styles = variant === 'Paid' 
    ? "bg-[#4ADE80] text-white"   // Verde vibrante
    : variant === 'Pending'
    ? "bg-[#FB923C] text-white"   // Naranja vibrante
    : "bg-slate-100 text-slate-800";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles}`}>
      {children}
    </span>
  );
};

// ==========================================
// 1. COMPONENTE: MODAL DE AUMENTAR STOCK (+)
// ==========================================
const StockModal = ({ isOpen, onClose, product, onConfirm }: any) => {
  if (!isOpen || !product) return null;
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState(''); // Estado para mensajes de error

  const availableVariations = product.variations.filter((v: any) => v.stock >= 0);
  
  const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
  
  // Seleccionar la primera talla por defecto al abrir
  useEffect(() => {
    if (product.variations.length > 0) setSize(product.variations[0].size);
    else setSize('M'); // Fallback si es producto nuevo
  }, [product]);


  const handleSubmit = () => {
    // 2. VALIDACIÓN CRÍTICA
    if (!selectedVarId) {
        setError('⚠️ ¡Selecciona una talla primero!');
        return; // Detiene la ejecución aquí. No guarda nada.
    }

    onConfirm(product.id, size, qty, newPrice);
    
    // Limpieza al cerrar
    setError('');
    setNewPrice('');
    setSize(''); 
    onClose();
  };
 
  // Icono dinámico
  const IconComponent = Icons[product.category.name as keyof typeof Icons] || Icons.Poleras;
  const currentScale = SIZE_SCALES[product.category.sizeType] || SIZE_SCALES['LETTER'];
  console.log(product)
  console.log(currentScale)
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl scale-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Reponer Stock</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Resumen Producto */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
            <IconComponent size={82} />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{product.name}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">Stock Total: {product.totalStock}</p>
          </div>
        </div>

        {/* Selección de Talla */}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
               Talla ({product.category.sizeType === 'NUMERIC' ? 'Num' : 'Letra'})
            </label>
            {/* Mensaje de Error si intenta guardar sin talla */}
            {error && <span className="text-xs font-bold text-red-500 animate-pulse">{error}</span>}
          </div>
            <div className="flex gap-2 flex-wrap">
                {availableVariations.map((v: any) => (
                    <button
                        key={v.id}
                        onClick={() => setSelectedVarId(v.id)}
                        className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                            selectedVarId === v.id 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                            : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                        {v.size} <span className="text-[10px] font-normal opacity-60 ml-1">({v.stock})</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Bloque: Cantidad y Precio */}
        <div className="flex gap-4 mb-8">
            
            {/* Cantidad */}
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cantidad</label>
                <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold text-slate-500">-</button>
                    <input 
                        type="number" 
                        value={qty} 
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full text-center font-bold text-slate-800 bg-transparent outline-none" 
                    />
                    <button onClick={() => setQty(qty + 1)} className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold text-slate-500">+</button>
                </div>
            </div>

            {/* Nuevo Precio (Opcional) */}
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Nuevo Precio
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">Bs</span>
                    <input 
                        type="number" 
                        placeholder={String(product.price)} // Muestra el actual grisado
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 pl-8 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                </div>
                {/* Mensajito de ayuda */}
                {newPrice && newPrice !== String(product.price) && (
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                        Se actualizará todo el stock
                    </span>
                )}
            </div>
        </div>
        

        <button 
            onClick={handleSubmit} 
            className={`w-full py-4 font-bold rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                size ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          <Plus size={24} strokeWidth={3} /> 
          {size ? 'Confirmar Ingreso' : 'Elige una talla'}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENTE: MODAL DE VENTA ($)
// ==========================================
const SaleModal = ({ isOpen, onClose, product, onConfirm }: any) => {
  if (!isOpen || !product) return null;
  
  // Filtrar solo tallas con stock > 0
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
    }else{
        setError('⚠️ ¡Selecciona una talla primero!');
        return; // Detiene la ejecución aquí. No guarda nada.
    }

  };

  const IconComponent = Icons[product.category.name as keyof typeof Icons] || Icons.Poleras;

  // ESTADO: SIN STOCK
  if (availableVariations.length === 0) return (
     <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white p-8 rounded-[2rem] text-center max-w-xs shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Package size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¡Sin Stock!</h3>
            <p className="text-slate-500 mb-6 text-sm">No quedan tallas disponibles para vender de este producto.</p>
            <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Entendido</button>
        </div>
     </div>
  );
  const colorClasses = PRODUCT_COLORS[product.color] || PRODUCT_COLORS['Blue'];
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Nueva Venta</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"><X size={20}/></button>
        </div>

        {/* Imagen Principal */}
        <div className="flex justify-center mb-6">
           <div className={`w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center ${colorClasses}`}>
              <IconComponent size={82} />
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                x{qty}
              </div>
           </div>
        </div>

        {/* Selector de Talla */}
        <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Selecciona Talla</label>
            <div className="flex gap-2 flex-wrap">
                {availableVariations.map((v: any) => (
                    <button
                        key={v.id}
                        onClick={() => setSelectedVarId(v.id)}
                        className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                            selectedVarId === v.id 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                            : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                        {v.size} <span className="text-[10px] font-normal opacity-60 ml-1">({v.stock})</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Cantidad */}
        <div className="mb-8">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cantidad</label>
            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform">-</button>
            <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full text-center text-3xl font-bold text-slate-800 bg-transparent outline-none" 
            />
            <button onClick={() => setQty(qty + 1)} className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform">+</button>
            </div>
        </div>          
        {/* Precio Editable */}
        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Precio de Venta</label>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Editable</span>
            </div>
            <div className="flex items-center">
                <span className="text-2xl font-bold text-slate-400 mr-2">Bs</span>
                <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-transparent text-4xl font-black text-slate-800 outline-none"
                />
            </div>
        </div>

        <button onClick={handleSubmit} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95">
            <Check size={24} strokeWidth={3} /> Confirmar Venta
        </button>
      </div>
    </div>
  );
};


// ==========================================
// 3. APP PRINCIPAL
// ==========================================
export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qué modal se abre
  const [stockModalData, setStockModalData] = useState<Product | null>(null);
  const [saleModalData, setSaleModalData] = useState<Product | null>(null);

  // Cargar datos del Backend
  const fetchData = async () => {
    try {
      // 1. Cargar Inventario (Para la lista)
      const resProds = await fetch(`${API_URL}/products`);
      const dataProds = await resProds.json();
      setProducts(dataProds);

      // 2. Cargar Total Ventas (Para el Header) - Usamos /dashboard solo para stats
      const resStats = await fetch(`${API_URL}/dashboard`);
      const dataStats = await resStats.json();
      setTotalRevenue(dataStats.stats?.totalRevenue || 0);

      setLoading(false);
    } catch (error) {
      console.error("Error cargando datos", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACCIONES ---
  const handleAddStock = async (productId: number, size: string, quantity: number,newPrice?: string) => {
    await fetch(`${API_URL}/stock/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, size, quantity,newPrice })
    });
    fetchData(); // Recargar para ver cambios
  };

  const handleCreateSale = async (items: any[]) => {
    await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
    });
    fetchData(); // Recargar para ver cambios
  };

  // 1. Intentamos leer del localStorage al iniciar
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Si NO hay usuario, mostramos la pantalla de Registro
  if (!currentUser) {
    return <Register onRegisterSuccess={(user: any) => setCurrentUser(user)} />;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">Cargando CENTRAL...</div>;

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md relative pb-32">
        
        {/* Header: Total Sales */}
        <div className="pt-8 px-6 mb-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/60 relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Ventas Totales</h2>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight text-slate-900">
                        Bs {Number(totalRevenue).toLocaleString()}
                    </span>
                    <div className="flex items-center text-emerald-500 font-bold text-xs mb-2 bg-emerald-50 px-2 py-1 rounded-lg">
                        <TrendingUp size={14} className="mr-1" strokeWidth={3} />
                        +15%
                    </div>
                </div>
            </div>
            {/* Decoración de fondo */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
          </div>
        </div>

        {/* Título de Sección */}
        <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-lg font-bold text-slate-800">Inventario Activo</h2>
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">{products.length} Items</span>
        </div>

        {/* Lista de Productos (INVENTARIO) */}
        <div className="px-4 space-y-4">
          {products.map((item) => {
            const IconComponent = Icons[item.category.name as keyof typeof Icons] || Icons.Poleras;
            
            // Colores dinámicos según stock
            const isLowStock = item.totalStock < 5;
            const colorClasses = PRODUCT_COLORS[item.color] || PRODUCT_COLORS['Blue'];
            return (
              <div key={item.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-white/60 flex items-center gap-4 transition-all hover:shadow-md">
                
                {/* 1. Icono del Producto */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${colorClasses}`}>
                   <IconComponent size={75} /> 
                </div>

                {/* 2. Información */}
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

                {/* 3. Botones de Acción */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Botón Aumentar Stock (+) */}
                  <button 
                    onClick={() => setStockModalData(item)}
                    className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                  
                  {/* Botón Vender (Carrito) */}
                  <button 
                    onClick={() => setSaleModalData(item)}
                    className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                  >
                    <ShoppingCart size={18} strokeWidth={2.5} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Navigation (Solo decorativo por ahora, pero mantiene el estilo) */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="w-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-3 flex gap-8 items-center pointer-events-auto">
              <button className="p-2 text-blue-600"><Home size={26} strokeWidth={2.5} /></button>
              {/* El botón central ahora podría ser "Crear Producto Nuevo" en el futuro */}
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg">
                <Plus size={24} />
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600"><BarChart2 size={26} /></button>
            </div>
        </div>
        
        {/* Gradiente inferior */}
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F2F4F8] to-transparent pointer-events-none z-10" />

      </div>

      {/* RENDERIZADO DE MODALES (Portals lógicos) */}
      <StockModal 
        isOpen={!!stockModalData} 
        onClose={() => setStockModalData(null)} 
        product={stockModalData}
        onConfirm={handleAddStock}
      />

      <SaleModal 
        isOpen={!!saleModalData} 
        onClose={() => setSaleModalData(null)} 
        product={saleModalData}
        onConfirm={handleCreateSale}
      />
    </div>
  );
}