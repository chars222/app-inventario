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

export const InventoryReport = ({ token, role }: { token: string; role: string }) => {

  const isOwner = role === 'OWNER';
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
    exportToCSV("Reporte_Ventas", rows);
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
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Unidades totales" value={fmt(totals.totalUnits)} sub={`${totals.totalProducts} productos`} accent="bg-slate-900 text-white" />
       {isOwner && (
         <StatCard label="Valor al costo" value={`Bs ${fmt(totals.totalStockValue)}`} accent="bg-slate-100 text-slate-800" />
       )}
       {isOwner && (
        <StatCard label="Valor retail" value={`Bs ${fmt(totals.totalRetailValue)}`} accent="bg-blue-50 text-blue-900" />
       )}
       {isOwner && (
        <StatCard label="Ganancia potencial" value={`Bs ${fmt(totals.totalPotentialProfit)}`} sub="si vendes todo" accent="bg-emerald-50 text-emerald-900" />
       )}
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
                  const isLow = p.totalStock < 5;
                  
                  const margin = p.retailValue > 0 ? ((p.potentialProfit / p.retailValue) * 100).toFixed(1) : '0';

                  return (
                    <div key={p.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden print:border-slate-300 print:break-inside-avoid print:shadow-none">
                      
                      {/* TARJETA PRINCIPAL EXACTA A TU CAPTURA */}
                            <button
                      className="w-full flex items-center gap-3 p-4 text-left"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <IconComp size={30} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{p.category}</p>
                      </div>
                      <div className="text-right shrink-0 mr-1">
                        <p className={`text-lg font-black ${isLow ? 'text-red-500' : 'text-slate-800'}`}>
                          {p.totalStock}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">uds</p>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                    </button>

                      {/* DETALLE DESPLEGABLE EXACTO A TU CAPTURA */}
                     {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-50">
                  {/* Mini stats */}
                  {isOwner && (
                  <div className="grid grid-cols-3 gap-2 my-3">
                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Costo u.</p>
                      <p className="font-black text-slate-700 text-sm">Bs {fmt(p.cost)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-blue-400 font-bold uppercase">Precio u.</p>
                      <p className="font-black text-blue-700 text-sm">Bs {fmt(p.price)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">Gan. pot.</p>
                      <p className="font-black text-emerald-700 text-sm">Bs {fmt(p.potentialProfit)}</p>
                    </div>
                  </div>
                  )}

                  {/* Por talla */}
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Desglose por talla
                  </p>
                  <div className="space-y-1.5">
                    {p.variations.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <span className="w-10 text-xs font-black text-slate-600 bg-slate-100 rounded-lg py-1 text-center">
                          {v.size}
                        </span>
                        {/* Barra proporcional */}
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${v.stock === 0 ? 'bg-red-300' : 'bg-blue-400'}`}
                            style={{ width: `${Math.min(100, (v.stock / (p.totalStock || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black w-6 text-right ${v.stock === 0 ? 'text-red-400' : 'text-slate-700'}`}>
                          {v.stock}
                        </span>
                      </div>
                    ))}
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
