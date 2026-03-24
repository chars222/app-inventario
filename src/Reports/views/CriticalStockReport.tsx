import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {Icons} from '../../components/Icons';
import { exportToCSV } from '../utils/exportToCSV';
import { ExportButtons } from '../components/SharedUI';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';
export const CriticalStockReport = ({ token }: { token: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const threshold = 5; // Límite para considerarse crítico

  useEffect(() => {
    fetch(`${API_URL}/reports/critical-stock?threshold=${threshold}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [token]);

  const handleExportCSV = () => {
    const rows = [
      ["Producto", "Categoría", "Color", "Talla", "Stock Actual"],
      ...data.flatMap((p: any) => p.variations.map((v: any) => [p.name, p.category, p.color, v.size, v.stock]))
    ];
    exportToCSV(`Alerta_Stock_Critico`, rows);
  };

  if (loading) return <div className="text-center text-slate-400 font-bold mt-10">Revisando inventario...</div>;

  return (
    <div className="space-y-4 pb-10">
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3 print:border-slate-300">
        <AlertTriangle size={24} className="text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-black text-orange-900">Alerta de Compras</h3>
          <p className="text-xs text-orange-700 font-medium">Estos productos tienen {threshold} o menos unidades en stock. Se recomienda reponer inventario.</p>
        </div>
      </div>
      
      <ExportButtons onCSV={handleExportCSV} onPDF={() => window.print()} />

      {data.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <p className="text-emerald-500 font-bold">¡Todo perfecto! No tienes stock crítico.</p>
        </div>
      ) : (
        <div className="space-y-3 print:space-y-1">
          {data.map((p: any) => {
              const IconComponent = Icons[p.category.iconKey as keyof typeof Icons] || Icons.Poleras;
              const colorClasses = PRODUCT_COLORS[p.color] || PRODUCT_COLORS['Blue'];
            const IconComp = Icons[p.iconKey as keyof typeof Icons] || Icons.Poleras;
            return (
              <div key={p.productId} className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 print:border-slate-300 print:shadow-none print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 print:border"><IconComp size={24} className={colorClasses}/></div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{p.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{p.category} • {p.color}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {p.variations.map((v: any) => (
                    <div key={v.id} className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 flex items-center gap-2 print:bg-transparent print:border-slate-300">
                      <span className="font-black text-sm text-red-900 print:text-black">{v.size}</span>
                      <span className="text-[10px] font-bold bg-white text-red-600 px-1.5 py-0.5 rounded shadow-sm print:border print:text-black">{v.stock} uds</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
