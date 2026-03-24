import React, { useState, useEffect } from 'react';
import { exportToCSV } from '../utils/exportToCSV';
import { ExportButtons, PeriodSelector, StatCard } from '../components/SharedUI';
import { fmt, getPeriodDates } from '../utils/constants';
import { Package } from 'lucide-react';
import {Icons} from '../../components/Icons';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';
export const SalesReport = ({ token }: { token: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    
    const fetchInventory = async () => {
    const { from, to } = getPeriodDates(period);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
      try {
        const res = await fetch(`${API_URL}/reports/sales?${params}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        const jsonData = await res.json();
        setData(jsonData);
        setLoading(false);
      } catch (err: any) {
        setError("No se pudo cargar el inventario.");
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [token, period]);

  if (error) return <div className="text-center text-red-500 font-bold mt-10">{error}</div>;
  return (
    <div className="space-y-4">
      <PeriodSelector period={period} setPeriod={setPeriod} />
      {loading ? <div className="text-center text-slate-400 font-bold mt-10">Calculando utilidades...</div> : !data ? null : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Ingresos" value={`Bs ${fmt(data.totals.totalRevenue)}`} sub={`${data.totals.totalSales} ventas`} accent="bg-slate-900 text-white" />
            <StatCard label="Utilidad neta" value={`Bs ${fmt(data.totals.totalProfit)}`} accent="bg-emerald-500 text-white" />
          </div>
          {data.byProduct.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Utilidad por producto</p>
              {data.byProduct.map((p: any) => {
                const IconComp = (Icons as Record<string, any>)[p.iconKey] || Package;
                const colorClass = PRODUCT_COLORS[p.color] || PRODUCT_COLORS.Blue;
                const isOpen = expanded === p.productId;

                return (
                  <div key={p.productId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : p.productId)}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}><IconComp size={30} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{p.productName}</p>
                        <p className="text-xs font-bold text-emerald-600">Bs {fmt(p.totalProfit)} utilidad · {p.margin}%</p>
                      </div>
                      <div className="text-right shrink-0 mr-1">
                        <p className="text-lg font-black text-slate-800">{p.totalQuantity}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">uds</p>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-slate-50">
                        <div className="grid grid-cols-3 gap-2 my-3">
                          <div className="bg-slate-50 rounded-xl p-2 text-center"><p className="text-[10px] text-slate-400 font-bold uppercase">Ingreso</p><p className="font-black text-slate-700 text-sm">Bs {fmt(p.totalRevenue)}</p></div>
                          <div className="bg-red-50 rounded-xl p-2 text-center"><p className="text-[10px] text-red-400 font-bold uppercase">Costo</p><p className="font-black text-red-700 text-sm">Bs {fmt(p.totalCost)}</p></div>
                          <div className="bg-emerald-50 rounded-xl p-2 text-center"><p className="text-[10px] text-emerald-400 font-bold uppercase">Utilidad</p><p className="font-black text-emerald-700 text-sm">Bs {fmt(p.totalProfit)}</p></div>
                        </div>
                        <div className="space-y-2">
                          {p.bySizeAndColor.map((sc: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                              <span className="w-8 text-xs font-black text-slate-600 text-center">{sc.size}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500 font-bold">{sc.quantity} uds · Bs {fmt(sc.revenue)}</span>
                                  <span className="text-emerald-600 font-black">+Bs {fmt(sc.profit)}</span>
                                </div>
                                <div className="flex gap-0.5 mt-1 h-1.5 rounded-full overflow-hidden bg-red-200">
                                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${sc.revenue > 0 ? (sc.profit / sc.revenue) * 100 : 0}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
