
import React, { useState, useEffect } from 'react';
import { Trophy} from 'lucide-react';
import { exportToCSV } from '../utils/exportToCSV';
import { ExportButtons, PeriodSelector, StatCard } from '../components/SharedUI';
import { fmt, getPeriodDates } from '../utils/constants';

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
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodDates(period);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    fetch(`${API_URL}/reports/sellers?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [token, period]);

  const handleExportCSV = () => {
    const rows = [
      ["Ranking", "Vendedor", "Rol", "Ventas Realizadas", "Prendas Vendidas", "Ingresos Generados (Bs)"],
      ...data.map((s: any, i: number) => [i + 1, s.name, s.role, s.totalSalesCount, s.totalItemsSold, s.totalRevenue])
    ];
    exportToCSV(`Rendimiento_Vendedores_${period}`, rows);
  };

  const totalRevenueAll = data.reduce((sum, s) => sum + s.totalRevenue, 0);

  return (
    <div className="space-y-4 pb-10">
      <PeriodSelector period={period} setPeriod={setPeriod} />
      
      {loading ? <div className="text-center text-slate-400 font-bold mt-10">Calculando comisiones...</div> : (
        <>
          <ExportButtons onCSV={handleExportCSV} onPDF={() => window.print()} />
          <div className="space-y-3 mt-4 print:space-y-1">
            {data.length === 0 ? (
              <p className="text-center text-slate-400 font-bold">No hay ventas registradas.</p>
            ) : data.map((seller: any, index: number) => (
              <div key={seller.id} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-4 print:border-slate-300 print:shadow-none print:break-inside-avoid">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-100 text-amber-600 print:border' : 'bg-slate-100 text-slate-500 print:border'}`}>
                    {index === 0 ? <Trophy size={20} className="print:hidden"/> : `#${index + 1}`}
                    <span className="hidden print:block">{index === 0 ? '#1' : ''}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{seller.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{seller.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-600 leading-none print:text-black">Bs {fmt(seller.totalRevenue)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{seller.totalSalesCount} transacciones</p>
                  </div>
                </div>
                
                {/* Barra de contribución */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase">
                    <span>Contribución a la empresa</span>
                    <span>{totalRevenueAll > 0 ? Math.round((seller.totalRevenue / totalRevenueAll) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 print:hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${totalRevenueAll > 0 ? (seller.totalRevenue / totalRevenueAll) * 100 : 0}%` }}></div>
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