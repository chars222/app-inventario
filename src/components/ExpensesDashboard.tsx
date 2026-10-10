import React, { useState, useEffect } from 'react';
import { TrendingDown, Plus, Trash2, X, Calendar, Wallet } from 'lucide-react';

interface Expense {
  id: number;
  concept: string;
  amount: number;
  date: string;
}

export const ExpensesDashboard = ({ token, apiUrl }: { token: string, apiUrl: string }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Formulario
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${apiUrl}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (error) {
      console.error("Error fetching expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount) return;

    try {
      const res = await fetch(`${apiUrl}/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ concept, amount: Number(amount) })
      });

      if (res.ok) {
        setConcept('');
        setAmount('');
        setShowModal(false);
        fetchExpenses();
      }
    } catch (error) {
      alert("Error al registrar el gasto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    
    try {
      const res = await fetch(`${apiUrl}/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchExpenses();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="w-full pb-32 animate-in fade-in">
      {/* HEADER Y TOTAL */}
      <div className="pt-8 px-5 mb-6">
        <div className="bg-red-600 rounded-[2rem] p-6 shadow-lg shadow-red-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xs font-bold text-red-200 uppercase tracking-wider mb-2">Total Egresos</h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tracking-tight text-white">Bs {totalExpenses}</span>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full blur-3xl opacity-10"></div>
          <TrendingDown size={120} className="absolute -right-6 -bottom-6 text-white opacity-10 stroke-1" />
        </div>
      </div>

      <div className="px-5 mb-4 flex justify-between items-end">
        <h2 className="text-lg font-black text-slate-900">Historial Operativo</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-100 transition-colors"
        >
          <Plus size={14} /> Registrar
        </button>
      </div>

      {/* LISTA DE EGRESOS */}
      <div className="px-5 flex flex-col gap-3 mt-4">
        {loading ? (
          <p className="text-center text-slate-400 font-bold py-10">Cargando...</p>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <Wallet size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="font-bold text-slate-500">Sin gastos registrados</p>
          </div>
        ) : (
          expenses.map(exp => (
            <div key={exp.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{exp.concept}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={10} /> {new Date(exp.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-red-600 text-base">- Bs {exp.amount}</span>
                <button 
                  onClick={() => handleDelete(exp.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL REGISTRO DE GASTO */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Registrar Gasto</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Concepto (Ej: Luz, Internet, Delivery)</label>
                <input 
                  type="text" 
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="¿En qué se gastó?"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Monto (Bs)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="0.00"
                  required
                  min="1"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-red-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all mt-4"
              >
                Guardar Egreso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};