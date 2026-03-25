import React, { useState, useEffect } from 'react';
import { exportToCSV } from '../utils/exportToCSV';
import { ExportButtons, PeriodSelector, StatCard } from '../components/SharedUI';
import { fmt, getPeriodDates } from '../utils/constants';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
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
export const SalesReport = ({ token, role }: { token: string; role: string }) => {
  const isOwner = role === 'OWNER';
  console.log(isOwner);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [period, setPeriod] = useState('month');

  const getPeriodDates = () => {
    const now = new Date();
    if (period === 'today') {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      return { from: s.toISOString(), to: now.toISOString() };
    }
    if (period === 'week') {
      const s = new Date(now); s.setDate(s.getDate() - 7);
      return { from: s.toISOString(), to: now.toISOString() };
    }
    if (period === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: s.toISOString(), to: now.toISOString() };
    }
    return {};
  };

  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodDates();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    fetch(`${API_URL}/reports/sales?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [token, period]);

  const PERIODS = [
    { key: 'today', label: 'Hoy' },
    { key: 'week',  label: '7 días' },
    { key: 'month', label: 'Este mes' },
  ];
  
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

  return (
    <div className="space-y-4">
      <ExportButtons onCSV={handleExportCSV} onPDF={() => window.print()} />
      {/* Selector período */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              period === p.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-slate-400 font-bold text-sm">
          Calculando utilidades...
        </div>
      ) : !data ? null : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Ingresos" value={`Bs ${fmt(data.totals.totalRevenue)}`} sub={`${data.totals.totalSales} ventas`} accent="bg-slate-900 text-white" />
            {isOwner && (
            <StatCard label="Costo total" value={`Bs ${fmt(data.totals.totalCost)}`} accent="bg-red-50 text-red-900" />
            )}
            {isOwner && (
            <StatCard label="Utilidad neta" value={`Bs ${fmt(data.totals.totalProfit)}`} accent="bg-emerald-500 text-white" />
            )}
             {isOwner && (
            <StatCard
              label="Margen"
              value={`${data.totals.totalRevenue > 0 ? ((data.totals.totalProfit / data.totals.totalRevenue) * 100).toFixed(1) : 0}%`}
              sub={`${data.totals.totalUnits} unidades`}
              accent="bg-blue-50 text-blue-900"
            />
            )}
          </div>

          {/* Por producto */}
          {data.byProduct.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-slate-400 font-bold">Sin ventas en este período</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                Utilidad por producto
              </p>
              {data.byProduct.map((p: any) => {
                const IconComp = Icons[p.iconKey as keyof typeof Icons] || Icons.Poleras;
                const colorClass = PRODUCT_COLORS[p.color] || PRODUCT_COLORS.Blue;
                const isOpen = expanded === p.productId;

                return (
                  <div key={p.productId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left"
                      onClick={() => setExpanded(isOpen ? null : p.productId)}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <IconComp size={30} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{p.productName}</p>
                        <p className="text-xs font-bold text-emerald-600">
                          Bs {fmt(p.totalProfit)} utilidad · {p.margin}%
                        </p>
                      </div>
                      <div className="text-right shrink-0 mr-1">
                        <p className="text-lg font-black text-slate-800">
                          {p.totalQuantity}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">uds</p>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-slate-50">
                        {/* Mini stats */}
                        <div className="grid grid-cols-3 gap-2 my-3">
                          <div className="bg-slate-50 rounded-xl p-2 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Ingreso</p>
                            <p className="font-black text-slate-700 text-sm">Bs {fmt(p.totalRevenue)}</p>
                          </div>
                          {isOwner && (
                          <div className="bg-red-50 rounded-xl p-2 text-center">
                            <p className="text-[10px] text-red-400 font-bold uppercase">Costo</p>
                            <p className="font-black text-red-700 text-sm">Bs {fmt(p.totalCost)}</p>
                          </div>
                          )}
                          {isOwner && (
                          <div className="bg-emerald-50 rounded-xl p-2 text-center">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase">Utilidad</p>
                            <p className="font-black text-emerald-700 text-sm">Bs {fmt(p.totalProfit)}</p>
                          </div>
                          )}
                        </div>

                        {/* Desglose por talla y color */}
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          Por talla
                        </p>
                        <div className="space-y-2">
                          {p.bySizeAndColor.map((sc: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                              <span className="w-8 text-xs font-black text-slate-600 text-center">{sc.size}</span>
                              <div className="flex-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500 font-bold">{sc.quantity} uds · Bs {fmt(sc.revenue)}</span>
                                  <span className="text-emerald-600 font-black">+Bs {fmt(sc.profit)}</span>
                                </div>
                                {/* Barra utilidad vs costo */}
                                <div className="flex gap-0.5 mt-1 h-1.5 rounded-full overflow-hidden bg-red-200">
                                  <div
                                    className="bg-emerald-400 h-full rounded-full"
                                    style={{ width: `${sc.revenue > 0 ? (sc.profit / sc.revenue) * 100 : 0}%` }}
                                  />
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

