import React from 'react';
import { Home, BarChart2, Plus, ArrowUp, ShoppingBag } from 'lucide-react';
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
// Componente Badge estilo shadcn/ui
const Badge = ({ children, variant }) => {
    const styles = variant === 'success'
        ? "bg-green-500 text-white"
        : variant === 'warning'
            ? "bg-orange-400 text-white"
            : "bg-slate-100 text-slate-800";
    return (<span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles}`}>
      {children}
    </span>);
};
export default function App() {
    return (<div className="min-h-screen bg-[#F2F4F8] flex justify-center font-sans text-slate-900">
      {/* Contenedor Móvil (Max Width para simular pantalla de celular en desktop) */}
      <div className="w-full max-w-md relative pb-24">
        
        {/* Header / Summary Card */}
        <div className="pt-8 px-4 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Total Sales</h2>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold tracking-tight text-black">
                $150,000
              </span>
              <div className="flex items-center text-green-500 font-semibold text-sm mb-1">
                <ArrowUp size={16} className="mr-0.5"/>
                <span>+15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="px-4 space-y-3">
          {transactions.map((item) => (<div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              {/* Icono / Imagen del producto */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.imageColor}`}>
                <ShoppingBag size={20} className={item.iconColor}/>
              </div>

              {/* Detalles centrales */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {item.title}
                </h3>
                
                {/* Badges de estado */}
                <div className="flex gap-1.5 mt-2">
                  {item.status.map((stat, idx) => (<Badge key={idx} variant={stat === 'Paid' ? 'success' : 'warning'}>
                      {stat}
                    </Badge>))}
                </div>
              </div>

              {/* Precios y Cantidad (Derecha) */}
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400 mb-1">
                  Qty: <span className="text-slate-600 font-medium">{item.qty}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Price: <span className="text-slate-600 font-medium">${item.price}</span>
                </div>
              </div>
            </div>))}
        </div>

        {/* Bottom Navigation Bar (Floating & Glassmorphism) */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
            {/* Contenedor interno para limitar ancho y habilitar clicks */}
            <div className="w-full max-w-[90%] md:max-w-[380px] bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl px-6 py-3 flex justify-between items-center pointer-events-auto">
              
              {/* Home Icon */}
              <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                <Home size={24}/>
              </button>

              {/* Add Button (Floating effect) */}
              <div className="relative -top-6 flex flex-col items-center">
                <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95">
                  <Plus size={28}/>
                </button>
                <span className="text-xs font-medium text-slate-600 mt-1">Add</span>
              </div>

              {/* Chart Icon */}
              <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                <BarChart2 size={24}/>
              </button>

            </div>
        </div>

        {/* Gradiente inferior para suavizar el final de la lista */}
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F2F4F8] to-transparent pointer-events-none z-10"/>
        
      </div>
    </div>);
}
