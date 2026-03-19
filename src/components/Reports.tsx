import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, ChevronDown, ChevronUp, ArrowLeft, BarChart2, Layers } from 'lucide-react';
import { Icons } from './Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PRODUCT_COLORS: Record<string, string> = {
  Blue:  'text-blue-600 bg-blue-50',
  Navy:  'text-indigo-800 bg-indigo-50',
  Red:   'text-red-600 bg-red-50',
  Black: 'text-slate-800 bg-slate-100',
  White: 'text-slate-600 bg-white border border-slate-200',
  Green: 'text-emerald-600 bg-emerald-50',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

// ─── TARJETA STAT ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent: string;
}) => (
  <div className={`rounded-2xl p-4 ${accent} flex flex-col gap-1`}>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
    <p className="text-2xl font-black leading-none">{value}</p>
    {sub && <p className="text-xs font-bold opacity-50">{sub}</p>}
  </div>
);

// ─── REPORTE INVENTARIO ───────────────────────────────────────────────────────
const InventoryReport = ({ token }: { token: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/reports/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div className="flex justify-center items-center h-48 text-slate-400 font-bold text-sm">
      Calculando inventario...
    </div>
  );

  const { totals, products } = data;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Unidades totales" value={fmt(totals.totalUnits)} sub={`${totals.totalProducts} productos`} accent="bg-slate-900 text-white" />
        <StatCard label="Valor al costo" value={`Bs ${fmt(totals.totalStockValue)}`} accent="bg-slate-100 text-slate-800" />
        <StatCard label="Valor retail" value={`Bs ${fmt(totals.totalRetailValue)}`} accent="bg-blue-50 text-blue-900" />
        <StatCard label="Ganancia potencial" value={`Bs ${fmt(totals.totalPotentialProfit)}`} sub="si vendes todo" accent="bg-emerald-50 text-emerald-900" />
      </div>

      {/* Lista productos */}
      <div className="space-y-3">
        {products.map((p: any) => {
          const IconComp = Icons[p.iconKey as keyof typeof Icons] || Icons.Poleras;
          const colorClass = PRODUCT_COLORS[p.color] || PRODUCT_COLORS.Blue;
          const isOpen = expanded === p.id;
          const isLow = p.totalStock < 5;

          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Cabecera */}
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

              {/* Detalle expandible */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-50">
                  {/* Mini stats */}
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
  );
};

// ─── REPORTE VENTAS ───────────────────────────────────────────────────────────
const SalesReport = ({ token }: { token: string }) => {
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

  return (
    <div className="space-y-4">
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
            <StatCard label="Costo total" value={`Bs ${fmt(data.totals.totalCost)}`} accent="bg-red-50 text-red-900" />
            <StatCard label="Utilidad neta" value={`Bs ${fmt(data.totals.totalProfit)}`} accent="bg-emerald-500 text-white" />
            <StatCard
              label="Margen"
              value={`${data.totals.totalRevenue > 0 ? ((data.totals.totalProfit / data.totals.totalRevenue) * 100).toFixed(1) : 0}%`}
              sub={`${data.totals.totalUnits} unidades`}
              accent="bg-blue-50 text-blue-900"
            />
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
                          <div className="bg-red-50 rounded-xl p-2 text-center">
                            <p className="text-[10px] text-red-400 font-bold uppercase">Costo</p>
                            <p className="font-black text-red-700 text-sm">Bs {fmt(p.totalCost)}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-2 text-center">
                            <p className="text-[10px] text-emerald-400 font-bold uppercase">Utilidad</p>
                            <p className="font-black text-emerald-700 text-sm">Bs {fmt(p.totalProfit)}</p>
                          </div>
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

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
interface ReportsProps {
  token: string;
  onBack: () => void;
}

export default function Reports({ token, onBack }: ReportsProps) {
  const [tab, setTab] = useState<'sales' | 'inventory'>('sales');

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex justify-center font-sans">
      <div className="w-full max-w-md pb-10">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#F2F4F8] pt-8 px-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Reportes</h1>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Análisis de tu negocio</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
            <button
              onClick={() => setTab('sales')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                tab === 'sales'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <TrendingUp size={16} />
              Ventas
            </button>
            <button
              onClick={() => setTab('inventory')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                tab === 'inventory'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Package size={16} />
              Inventario
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-5 pt-2">
          {tab === 'sales'
            ? <SalesReport token={token} />
            : <InventoryReport token={token} />
          }
        </div>
      </div>
    </div>
  );
}