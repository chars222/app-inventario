import React, { useState, useEffect } from 'react';
import { TrendingUp, Package,ArrowLeft, Trophy, Users, AlertTriangle } from 'lucide-react';
import { TopProductsReport } from './Reports/views/TopProductsReport';
import { SellersReport } from './Reports/views/SellersReport';
import { SalesReport } from './Reports/views/SalesReport';
import { InventoryReport } from './Reports/views/InventoryReport';
import { CriticalStockReport } from './Reports/views/CriticalStockReport';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';
export default function Reports({ token,user, onBack }: { token: string, user: any, onBack: () => void }) {
  // Ahora manejamos 5 tabs diferentes
  const [tab, setTab] = useState<'top' | 'sales' | 'inventory' | 'sellers' | 'critical'>('top');

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex justify-center font-sans print:bg-white">
      <div className="w-full max-w-md pb-10 print:w-full print:max-w-none print:pb-0">

        {/* Header - Oculto al imprimir */}
        <div className="sticky top-0 z-20 bg-[#F2F4F8] pt-8 px-5 pb-3 print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Reportes</h1>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Análisis avanzado</p>
            </div>
          </div>

          {/* Selector de Tabs Horizontales (Scrollable) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        
            <button onClick={() => setTab('top')} className={`px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${tab === 'top' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <Trophy size={16} /> Top Ventas
            </button>
            <button onClick={() => setTab('inventory')} className={`px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${tab === 'inventory' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <Package size={16} /> Inventario
            </button>
            <button onClick={() => setTab('sellers')} className={`px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${tab === 'sellers' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <Users size={16} /> Vendedores
            </button>
            <button onClick={() => setTab('sales')} className={`px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${tab === 'sales' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <TrendingUp size={16} /> Utilidades
            </button>

            <button onClick={() => setTab('critical')} className={`px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${tab === 'critical' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <AlertTriangle size={16} /> Stock Crítico
            </button>
          </div>
        </div>

        {/* Título solo visible en el PDF */}
        <div className="hidden print:block mb-6 px-5 pt-8">
           <h1 className="text-3xl font-black text-black border-b-2 border-black pb-2">
             {tab === 'top' && 'Reporte de Productos Más Vendidos'}
             {tab === 'sellers' && 'Reporte de Rendimiento de Vendedores'}
             {tab === 'sales' && 'Reporte de Utilidad de Ventas'}
             {tab === 'inventory' && 'Reporte de Inventario Actual'}
             {tab === 'critical' && 'Reporte de Stock Crítico (Compras)'}
           </h1>
           <p className="text-sm font-bold text-gray-500 mt-1">Generado el: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Contenido Dinámico */}
        <div className="px-5 pt-2">
          {tab === 'top' && <TopProductsReport token={token} />}
          {tab === 'sellers' && <SellersReport token={token} />}
          {tab === 'sales' && <SalesReport token={token} />}
          {tab === 'inventory' && <InventoryReport token={token} />}
          {tab === 'critical' && <CriticalStockReport token={token} />}
        </div>
      </div>
    </div>
  );
}