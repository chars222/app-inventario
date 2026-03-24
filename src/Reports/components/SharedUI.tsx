import {  Download, Printer } from 'lucide-react';
import { PERIODS } from '../utils/constants';
export const StatCard = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string; }) => (
  <div className={`rounded-2xl p-4 ${accent} flex flex-col gap-1 print:border print:border-slate-300 print:text-black`}>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 print:opacity-100">{label}</p>
    <p className="text-2xl font-black leading-none">{value}</p>
    {sub && <p className="text-xs font-bold opacity-50 print:opacity-100">{sub}</p>}
  </div>
);

export const PeriodSelector = ({ period, setPeriod }: any) => (
  <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl mb-4 print:hidden">
    {PERIODS.map(p => (
      <button key={p.key} onClick={() => setPeriod(p.key)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${period === p.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
        {p.label}
      </button>
    ))}
  </div>
);

export const ExportButtons = ({ onCSV, onPDF }: { onCSV: () => void, onPDF: () => void }) => (
  <div className="flex justify-end gap-2 mb-4 print:hidden">
    <button onClick={onCSV} className="text-xs font-bold flex items-center gap-1.5 bg-white border border-slate-200 text-emerald-700 px-3 py-2 rounded-xl shadow-sm hover:bg-emerald-50 active:scale-95 transition-all">
      <Download size={14}/> CSV (Excel)
    </button>
    <button onClick={onPDF} className="text-xs font-bold flex items-center gap-1.5 bg-white border border-slate-200 text-red-600 px-3 py-2 rounded-xl shadow-sm hover:bg-red-50 active:scale-95 transition-all">
      <Printer size={14}/> PDF
    </button>
  </div>
);
