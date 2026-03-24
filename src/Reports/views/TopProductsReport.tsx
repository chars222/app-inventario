import React, { useState, useEffect } from 'react';
import {Icons} from '../../components/Icons';
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

export const TopProductsReport = ({ token }: { token: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodDates(period);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`${API_URL}/reports/top-products?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [token, period]);

  return (
    <div className="space-y-4 pb-10">
      <PeriodSelector period={period} setPeriod={setPeriod} />
      {loading ? <div className="text-center text-slate-400 font-bold mt-10">Buscando best sellers...</div> : (
        <div className="space-y-3 mt-4">
          <ExportButtons onCSV={() => exportToCSV('Top', [["Rank", "Nombre", "Cantidad"], ...data.map((p:any, i:number)=>[i+1, p.name, p.totalQuantity])])} onPDF={() => window.print()} />
          {data.map((p: any, index: number) => {
             const IconComp = Icons[p.iconKey as keyof typeof Icons] || Icons.Poleras;
             const colorClass = PRODUCT_COLORS[p.color] || PRODUCT_COLORS.Blue;
             return (
              <div key={p.productId} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-4 relative print:border-slate-300">
                <div className="flex items-center gap-4 mt-2">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass} print:border`}><IconComp size={36} /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{p.name}</h3>
                    <p className="text-xs font-bold text-slate-400"># {index + 1} en Ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-800 leading-none">{p.totalQuantity}</p>
                  </div>
                </div>
              </div>
             )
          })}
        </div>
      )}
    </div>
  );
};