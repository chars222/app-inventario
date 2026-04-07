import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, Calendar, Plus, Wallet,ShieldAlert,Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';

interface ReportsProps {
  token: string;
  user: any;
  onBack: () => void;
}

export default function Reports({ token, user, onBack }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'GASTOS'>('RESUMEN');
  const isOwner = user?.role === 'OWNER';

  // Estados de datos (En un escenario real, los traes con fetch)
  const [stats, setStats] = useState({
    totalRevenue: 12450,
    totalCOGS: 7650,     // Costo de mercadería
    totalCommissions: 800, // Comisiones pagadas a vendedores
    totalExpenses: 500,  // Gastos operativos manuales
    netProfit: 3500      // (Revenue - COGS - Commissions - Expenses)
  });

  // Lista simulada de gastos (Para que veas cómo funciona la UX)
  const [expenses, setExpenses] = useState([
    { id: 1, concept: 'Pago quincena María', amount: 300, date: '2026-03-25' },
    { id: 2, concept: 'Publicidad Facebook', amount: 150, date: '2026-03-22' },
    { id: 3, concept: 'Bolsas de empaque', amount: 50, date: '2026-03-20' },
  ]);

  // Modal para agregar gasto
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '' });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.concept || !newExpense.amount) return;
    
    // Aquí harías el POST al backend (ej: /api/expenses)
    const newExp = {
      id: Date.now(),
      concept: newExpense.concept,
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split('T')[0]
    };
    
    setExpenses([newExp, ...expenses]);
    setStats({
      ...stats,
      totalExpenses: stats.totalExpenses + newExp.amount,
      netProfit: stats.netProfit - newExp.amount
    });
    
    setNewExpense({ concept: '', amount: '' });
    setShowExpenseModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-32 font-sans text-slate-900">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-[#F4F6F9] pt-8 px-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Finanzas</h1>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Marzo 2026</p>
            </div>
          </div>
          {isOwner && activeTab === 'GASTOS' && (
            <button onClick={() => setShowExpenseModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
              <Plus size={14} strokeWidth={3} /> Gasto
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('RESUMEN')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'RESUMEN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Resumen Real
            </button>
            {isOwner && (
                <button 
                    onClick={() => setActiveTab('GASTOS')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'GASTOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Gastos (Caja)
                </button>
            )}
        </div>
      </div>

      <div className="px-5 mt-4">
        
        {/* --- PESTAÑA 1: RESUMEN FINANCIERO --- */}
        {activeTab === 'RESUMEN' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* TARJETA PRINCIPAL DE UTILIDAD (LA VERDADERA) */}
                <div className="bg-gradient-to-br from-[#10b981] to-[#047857] p-6 rounded-[2rem] text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80">Utilidad Neta del Mes</p>
                            <span className="bg-white/20 px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-sm">Caja Real</span>
                        </div>
                        <p className="text-4xl font-black mt-1">Bs {stats.netProfit.toLocaleString()}</p>
                        <p className="text-xs font-bold text-emerald-100 mt-2">
                            Margen Neto: {((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%
                        </p>
                    </div>
                    <DollarSign size={100} className="absolute -right-4 -bottom-4 opacity-10" />
                </div>

                {/* DESGLOSE MATEMÁTICO */}
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mt-6">Desglose de Caja</h3>
                <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 space-y-4">
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp size={14} strokeWidth={3}/></div>
                            <span className="text-sm font-bold text-slate-700">Ingresos (Ventas)</span>
                        </div>
                        <span className="font-black text-slate-900">Bs {stats.totalRevenue.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><Package size={14} strokeWidth={3}/></div>
                            <span className="text-sm font-bold text-slate-500">Costo Mercadería</span>
                        </div>
                        <span className="font-black text-slate-500">- Bs {stats.totalCOGS.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><Users size={14} strokeWidth={3}/></div>
                            <span className="text-sm font-bold text-slate-500">Comisiones Pagadas</span>
                        </div>
                        <span className="font-black text-amber-600">- Bs {stats.totalCommissions.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Wallet size={14} strokeWidth={3}/></div>
                            <span className="text-sm font-bold text-slate-500">Gastos Operativos</span>
                        </div>
                        <span className="font-black text-red-600">- Bs {stats.totalExpenses.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center border-t-2 border-slate-100 pt-4 mt-2">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Queda en Caja</span>
                        <span className="font-black text-emerald-600 text-lg">Bs {stats.netProfit.toLocaleString()}</span>
                    </div>

                </div>
            </div>
        )}

        {/* --- PESTAÑA 2: GASTOS (EGRESOS MANUALES) --- */}
        {activeTab === 'GASTOS' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#fff1f2] p-5 rounded-[1.5rem] border border-red-50 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Total Gastos (Mes)</p>
                        <p className="text-2xl font-black text-[#9f1239] mt-1">Bs {stats.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
                        <TrendingDown size={24} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-4 flex items-start gap-3">
                    <ShieldAlert size={20} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-blue-800 leading-relaxed">
                        Anota aquí el pago de salarios a vendedores, alquileres, publicidad o bolsas. Estos montos se restarán automáticamente de tu Utilidad Neta para darte valores reales de ganancia.
                    </p>
                </div>

                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mt-6">Historial de Egresos</h3>
                
                <div className="space-y-3">
                    {expenses.length === 0 ? (
                        <p className="text-center text-sm font-bold text-slate-400 py-6">No hay gastos registrados este mes.</p>
                    ) : (
                        expenses.map(exp => (
                            <div key={exp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                                        <Wallet size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{exp.concept}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1 mt-0.5">
                                            <Calendar size={10} /> {exp.date}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-black text-red-600">- Bs {exp.amount}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

      </div>

      {/* MODAL AGREGAR GASTO */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-black text-slate-800 mb-1">Registrar Egreso</h3>
                <p className="text-xs text-slate-500 font-medium mb-5">Añade un pago de personal, servicio o insumo.</p>
                
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Concepto / Detalle</label>
                        <input required type="text" placeholder="Ej: Pago quincena vendedor" value={newExpense.concept} onChange={e => setNewExpense({...newExpense, concept: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Monto Pagado (Bs)</label>
                        <input required type="number" placeholder="Ej: 500" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full mt-1 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 placeholder-red-300" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-xl shadow-md hover:bg-red-700 transition-colors">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}