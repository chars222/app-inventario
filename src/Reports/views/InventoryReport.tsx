import React, { useState, useEffect,useMemo } from 'react';
import {ChevronDown, ChevronUp, Package} from 'lucide-react';
import {Icons} from '../../components/Icons';
import { exportToCSV } from '../utils/exportToCSV';
import { ExportButtons, StatCard } from '../components/SharedUI';
import { fmt } from '../utils/constants';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';

export const InventoryReport = ({ token }: { token: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/reports/inventory`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        setData(await res.json());
      } catch (err: any) {
        setError("No se pudo cargar el inventario.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [token]);

  // 🧠 Agrupamos por Categoría
  const groupedByCategory = useMemo(() => {
    if (!data?.products) return {};
    return data.products.reduce((acc: any, p: any) => {
      if (!acc[p.category]) {
        acc[p.category] = { iconKey: p.iconKey, products: [] };
      }
      acc[p.category].products.push(p);
      return acc;
    }, {});
  }, [data]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["ID", "Producto", "Categoría", "Color", "Talla", "Stock", "Costo (Bs)", "Precio (Bs)", "Valor Costo", "Valor Retail", "Ganancia Potencial"]
    ];
    data.products.forEach((p: any) => {
       p.variations.forEach((v: any) => {
          rows.push([
            p.id, p.name, p.category, p.color, v.size, v.stock, p.cost, p.price, 
            v.stock * p.cost, v.stock * p.price, (v.stock * p.price) - (v.stock * p.cost)
          ]);
       });
    });
    exportToCSV("Reporte_Inventario_Detallado", rows);
  };

  if (loading) return <div className="text-center text-slate-400 font-bold mt-10">Calculando inventario...</div>;
  if (error) return <div className="text-center text-red-500 font-bold mt-10">{error}</div>;
  if (!data) return null;

  const { totals } = data;
  const marginPerc = totals.totalRetailValue > 0 ? ((totals.totalPotentialProfit / totals.totalRetailValue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4 pb-10">
      <ExportButtons onCSV={handleExportCSV} onPDF={() => window.print()} />
      
      {/* KPIs Globales (Diseño similar a la captura oscura/verde) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1a202c] p-4 rounded-2xl flex flex-col justify-center print:border print:border-slate-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-black">Retail (Ingresos)</p>
          <p className="text-2xl font-black text-white leading-none mt-1 print:text-black">Bs {fmt(totals.totalRetailValue)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1 print:text-black">{totals.totalUnits} uds totales</p>
        </div>
        <div className="bg-[#fff1f2] p-4 rounded-2xl flex flex-col justify-center print:border print:border-slate-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400/80 print:text-black">Costo Inventario</p>
          <p className="text-2xl font-black text-[#881337] leading-none mt-1 print:text-black">Bs {fmt(totals.totalStockValue)}</p>
        </div>
        <div className="bg-[#10b981] p-4 rounded-2xl flex flex-col justify-center print:border print:border-slate-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80 print:text-black">Utilidad Potencial</p>
          <p className="text-2xl font-black text-white leading-none mt-1 print:text-black">Bs {fmt(totals.totalPotentialProfit)}</p>
        </div>
        <div className="bg-[#eff6ff] p-4 rounded-2xl flex flex-col justify-center print:border print:border-slate-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 print:text-black">Margen Promedio</p>
          <p className="text-2xl font-black text-[#1e3a8a] leading-none mt-1 print:text-black">{marginPerc}%</p>
          <p className="text-[10px] font-bold text-blue-400 mt-1 print:text-black">{totals.totalProducts} productos</p>
        </div>
      </div>

      {/* Renderizado Agrupado por Categorías */}
      <div className="space-y-6 print:space-y-4">
        {Object.entries(groupedByCategory).map(([catName, catData]: [string, any]) => {
          const CatIcon = (Icons as Record<string, any>)[catData.iconKey] || Package;

          return (
            <div key={catName}>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <CatIcon size={16} /> {catName}
              </h3>
              
              <div className="space-y-3">
                {catData.products.map((p: any) => {
                  const IconComp = (Icons as Record<string, any>)[p.iconKey] || Package;
                  const colorClass = PRODUCT_COLORS[p.color] || PRODUCT_COLORS.Blue;
                  const isOpen = expanded === p.id;
                  
                  const margin = p.retailValue > 0 ? ((p.potentialProfit / p.retailValue) * 100).toFixed(1) : '0';

                  return (
                    <div key={p.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden print:border-slate-300 print:break-inside-avoid print:shadow-none">
                      
                      {/* TARJETA PRINCIPAL EXACTA A TU CAPTURA */}
                      <button className="w-full flex items-center gap-4 p-4 text-left print:pointer-events-none" onClick={() => setExpanded(isOpen ? null : p.id)}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass} print:border`}>
                          <IconComp size={28} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-[15px] truncate">{p.name}</p>
                          <p className="text-sm font-bold text-emerald-600 mt-0.5 print:text-black">
                            Bs {fmt(p.potentialProfit)} utilidad pot. <span className="opacity-50">·</span> {margin}%
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center shrink-0 mr-1">
                          <p className={`text-lg font-black leading-none ${p.totalStock === 0 ? 'text-red-500' : 'text-slate-800'}`}>
                            {p.totalStock}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase mt-1">UDS</p>
                        </div>
                        <div className="shrink-0 text-slate-300 print:hidden">
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {/* DETALLE DESPLEGABLE EXACTO A TU CAPTURA */}
                      {(isOpen || window.matchMedia('print').matches) && (
                        <div className="px-4 pb-4">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1 print:text-black">Por Talla</p>
                          
                          {/* Lista Tallas con Stock (Muestra UDS y barra proporcional) */}
                          <div className="space-y-3 bg-[#f8fafc] border border-slate-100/50 rounded-2xl p-3 print:border-slate-300 print:bg-transparent">
                            {p.variations.map((v: any, i: number) => {
                              // Matemáticas para la barra (Utilidad vs Costo)
                              const vRetail = v.stock * p.price;
                              const vProfit = vRetail - (v.stock * p.cost);
                              const scMarginPerc = vRetail > 0 ? (vProfit / vRetail) * 100 : 0;
                              
                              return (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="w-8 text-sm font-black text-slate-700 text-center">{v.size}</span>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-end text-xs mb-1.5">
                                      <span className="text-slate-500 font-medium">
                                        Bs {fmt(vRetail)}
                                      </span>
                                      <span className="text-slate-500 font-black print:text-black">{v.stock} uds</span>
                                    </div>
                                    <div className="flex h-1.5 rounded-full overflow-hidden bg-[#fca5a5] print:hidden">
                                      <div className="bg-[#34d399] h-full rounded-full transition-all" style={{ width: `${scMarginPerc}%` }} />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
