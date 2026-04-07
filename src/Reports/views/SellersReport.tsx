import React, { useState, useEffect } from 'react';
import { Trophy, DollarSign, CalendarSearch } from 'lucide-react';
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

export const SellersReport = ({ token }: { token: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- NUEVOS ESTADOS PARA FECHAS ---
  const [period, setPeriod] = useState('month');
  const [customDates, setCustomDates] = useState({ 
      from: new Date().toISOString().split('T')[0], 
      to: new Date().toISOString().split('T')[0] 
  });

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
    // SI ELIGEN RANGO PERSONALIZADO (Corregido para zona horaria local):
    if (period === 'custom') {
      return {
          from: customDates.from ? new Date(`${customDates.from}T00:00:00`).toISOString() : '',
          to: customDates.to ? new Date(`${customDates.to}T23:59:59`).toISOString() : ''
      };
    }
    return {};
  };

  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodDates();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    fetch(`${API_URL}/reports/sellers?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [token, period, customDates]); // Escuchamos cambios en customDates también

  const handleExportCSV = () => {
    const rows = [
      ["Ranking", "Vendedor", "Rol", "Ventas Realizadas", "Prendas Vendidas", "Ingresos Generados (Bs)", "Comisión a Pagar (Bs)"],
      ...data.map((s: any, i: number) => [
          i + 1, s.name, s.role, s.totalSalesCount, s.totalItemsSold, s.totalRevenue, s.totalCommissions || 0
      ])
    ];
    exportToCSV(`Rendimiento_Vendedores_${period}`, rows);
  };

  const totalRevenueAll = data.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalCommissionsAll = data.reduce((sum, s) => sum + (s.totalCommissions || 0), 0);

  const PERIODS = [
    { key: 'today', label: 'Hoy' },
    { key: 'week',  label: '7 días' },
    { key: 'month', label: 'Este mes' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-4 pb-10">
      
      {/* ====================================
          SELECTOR DE FECHAS AVANZADO 
          ==================================== */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-2">
        <div className="flex gap-1 flex-1 bg-slate-100 p-1 rounded-xl">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                period === p.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Mostrar calendarios solo si "Personalizado" está activo */}
        {period === 'custom' && (
            <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Desde</span>
                    <input 
                        type="date" 
                        value={customDates.from}
                        onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-auto"
                    />
                </div>
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Hasta</span>
                    <input 
                        type="date" 
                        value={customDates.to}
                        onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-auto"
                    />
                </div>
            </div>
        )}
      </div>
      
      {loading ? <div className="text-center text-slate-400 font-bold mt-10">Calculando comisiones...</div> : (
        <>
          <ExportButtons onCSV={handleExportCSV} onPDF={() => window.print()} />

          {/* Tarjetas Totales */}
          {data.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4 print:hidden">
                  <StatCard label="Ingresos Totales" value={`Bs ${fmt(totalRevenueAll)}`} accent="bg-blue-50 text-blue-700" />
                  <StatCard label="Comisiones a Pagar" value={`Bs ${fmt(totalCommissionsAll)}`} accent="bg-amber-50 text-amber-700" />
              </div>
          )}

          <div className="space-y-3 mt-4 print:space-y-1">
            {data.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center mt-4">
                  <CalendarSearch className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-slate-400 font-bold">No hay ventas en este rango de fechas.</p>
              </div>
            ) : data.map((seller: any, index: number) => (
              <div key={seller.id || index} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-5 print:border-slate-300 print:shadow-none print:break-inside-avoid">
                
                {/* Cabecera del Vendedor */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-600 print:border' : 'bg-slate-100 text-slate-500 print:border'}`}>
                    {index === 0 ? <Trophy size={20} className="print:hidden"/> : `#${index + 1}`}
                    <span className="hidden print:block">{index === 0 ? '#1' : ''}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg truncate">{seller.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{seller.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-blue-600 leading-none print:text-black">Bs {fmt(seller.totalRevenue)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{seller.totalSalesCount} notas</p>
                  </div>
                </div>
                
                {/* Desglose y Comisión */}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prendas Vendidas</p>
                        <p className="font-black text-slate-700">{seller.totalItemsSold} uds.</p>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl text-right flex items-center gap-3">
                        <DollarSign size={24} className="text-amber-400" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/60">Comisión a Pagar</p>
                            <p className="font-black text-amber-600 text-lg leading-none mt-0.5">Bs {fmt(seller.totalCommissions || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Barra de contribución */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    <span>Contribución a la empresa</span>
                    <span>{totalRevenueAll > 0 ? Math.round((seller.totalRevenue / totalRevenueAll) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 print:hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${totalRevenueAll > 0 ? (seller.totalRevenue / totalRevenueAll) * 100 : 0}%` }}></div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};