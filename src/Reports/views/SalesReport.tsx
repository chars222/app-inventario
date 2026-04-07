import React, { useState, useEffect } from 'react';
import { exportToCSV } from '../utils/exportToCSV';
import { ExportButtons, StatCard } from '../components/SharedUI'; 
import { fmt } from '../utils/constants';
import { ChevronDown, ChevronUp, ReceiptText, User, Wallet, Plus, ShieldAlert, Calendar, Trash2 } from 'lucide-react';
import { Icons } from '../../components/Icons';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-600 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';

export const SalesReport = ({ token, role }: { token: string; role: string }) => {
  const isOwner = role === 'OWNER';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [period, setPeriod] = useState('month');
  const [customDates, setCustomDates] = useState({ 
      from: new Date().toISOString().split('T')[0], 
      to: new Date().toISOString().split('T')[0] 
  });
  
  // --- ESTADOS PARA GASTOS OPERATIVOS ---
  const [activeSubTab, setActiveSubTab] = useState<'VENTAS' | 'GASTOS'>('VENTAS');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '' });
  const [expenses, setExpenses] = useState<any[]>([]); // Lista real de gastos
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el Modal de Confirmación de Eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: number | null, concept: string}>({ 
    isOpen: false, id: null, concept: '' 
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
    if (period === 'custom') {
      return {
          from: customDates.from ? new Date(`${customDates.from}T00:00:00`).toISOString() : '',
          to: customDates.to ? new Date(`${customDates.to}T23:59:59`).toISOString() : ''
      };
    }
    return {};
  };

  // 1. CARGAMOS VENTAS Y GASTOS (GET)
  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodDates();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    // Petición de ventas
    const fetchSales = fetch(`${API_URL}/reports/sales?${params}`, { 
        headers: { Authorization: `Bearer ${token}` } 
    }).then(r => r.json());
    
    // Petición de gastos (Solo si es dueño)
    const fetchExpenses = isOwner 
        ? fetch(`${API_URL}/expenses?${params}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }).then(r => r.ok ? r.json() : [])
        : Promise.resolve([]);

    Promise.all([fetchSales, fetchExpenses])
      .then(([salesData, expensesData]) => {
        
        // Procesamos Ventas
        let processedData = salesData;
        if (Array.isArray(salesData)) {
          let tRev = 0, tCost = 0, tProf = 0, tComm = 0, tSales = 0, tUnits = 0;
          const pMap: any = {};
          
          salesData.forEach((s: any) => {
            tRev += s.totalRevenue || 0;
            tCost += s.totalCost || 0;
            tProf += s.totalProfit || 0;
            tComm += s.totalCommissions || 0;
            tSales += 1;
            
            s.items?.forEach((i: any) => {
              tUnits += i.quantity;
              if (!pMap[i.productId]) {
                pMap[i.productId] = {
                  productId: i.productId, productName: i.productName, iconKey: i.iconKey, color: i.color,
                  totalQuantity: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, bySizeAndColor: []
                };
              }
              const p = pMap[i.productId];
              p.totalQuantity += i.quantity; p.totalRevenue += i.revenue; p.totalCost += i.cost; p.totalProfit += i.profit;
              
              const sz = p.bySizeAndColor.find((x: any) => x.size === i.size);
              if (sz) {
                sz.quantity += i.quantity; sz.revenue += i.revenue; sz.profit += i.profit;
              } else {
                p.bySizeAndColor.push({ size: i.size, quantity: i.quantity, revenue: i.revenue, profit: i.profit });
              }
            });
          });
          processedData = {
            totals: { totalRevenue: tRev, totalCost: tCost, totalProfit: tProf, totalCommissions: tComm, totalSales: tSales, totalUnits: tUnits },
            byProduct: Object.values(pMap).sort((a: any, b: any) => b.totalProfit - a.totalProfit),
            sales: salesData 
          };
        }
        setData(processedData); 
        
        // Procesamos Gastos
        if (Array.isArray(expensesData)) {
            setExpenses(expensesData.map(e => ({
                ...e,
                displayDate: new Date(e.date).toLocaleDateString('es-ES')
            })));
        }
        
        setLoading(false); 
      });
  }, [token, period, isOwner, customDates]);

  const handleExportCSV = () => {
    if (!data || !data.sales) return;
    const rows = [
      ["ID Nota", "Fecha", "Vendedor", "Ingreso (Bs)", "Costo Mercadería (Bs)", "Comisión Vendedor (Bs)", "Utilidad Bruta (Bs)"]
    ];
    data.sales.forEach((s: any) => {
      rows.push([
        s.saleId || s.id, new Date(s.date).toLocaleString('es-ES'), s.seller || 'N/A',
        s.totalRevenue, s.totalCost, s.totalCommissions || 0, s.totalProfit
      ]);
    });
    
    // Si es dueño, también exportamos los gastos
    if (isOwner && expenses.length > 0) {
        rows.push([], ["--- GASTOS OPERATIVOS ---"]);
        rows.push(["Fecha", "Concepto", "Monto (Bs)"]);
        expenses.forEach(e => {
            rows.push([e.displayDate, e.concept, e.amount]);
        });
    }

    exportToCSV(`Reporte_Financiero_${period}`, rows);
  };

  // 2. AGREGAR GASTO (POST)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.concept || !newExpense.amount) return;
    
    setIsSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                concept: newExpense.concept,
                amount: Number(newExpense.amount)
            })
        });

        if (res.ok) {
            const addedExpense = await res.json();
            setExpenses([{ ...addedExpense, displayDate: new Date(addedExpense.date).toLocaleDateString('es-ES') }, ...expenses]);
            setNewExpense({ concept: '', amount: '' });
            setShowExpenseModal(false);
        } else {
            alert("Hubo un error al registrar el gasto");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  // 3. ELIMINAR GASTO (DELETE) - Ahora usa el estado del modal
  const confirmDeleteExpense = async () => {
    if (!deleteConfirm.id) return;

    try {
        const res = await fetch(`${API_URL}/expenses/${deleteConfirm.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            // Lo quitamos de la lista visualmente
            setExpenses(expenses.filter(e => e.id !== deleteConfirm.id));
            // Cerramos el modal
            setDeleteConfirm({ isOpen: false, id: null, concept: '' });
        } else {
            alert("Error al eliminar el gasto.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
  };

  // Cálculos Finales
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const realNetProfit = data ? (data.totals.totalProfit || 0) - totalExpensesAmount : 0;

  const PERIODS = [
    { key: 'today', label: 'Hoy' },
    { key: 'week',  label: '7 días' },
    { key: 'month', label: 'Este mes' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-4 pb-10">
      
      {/* Botones y Cabecera */}
      <div className="flex justify-between items-center gap-2">
          <ExportButtons onCSV={handleExportCSV} onPDF={() => window.print()} />
          
          {/* Botón flotante para Agregar Gasto (Solo si estás en la pestaña Gastos) */}
          {isOwner && activeSubTab === 'GASTOS' && (
              <button onClick={() => setShowExpenseModal(true)} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
                  <Plus size={16} strokeWidth={3} /> Añadir Gasto
              </button>
          )}
      </div>
      
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

      {loading ? (
        <div className="flex justify-center items-center h-48 text-slate-400 font-bold text-sm">
          Calculando finanzas...
        </div>
      ) : !data ? null : (
        <>
          {/* =======================
              KPIs FINANCIEROS (Actualizado con Gastos y Caja Real)
              ======================= */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Ingresos (Ventas)" value={`Bs ${fmt(data.totals.totalRevenue || 0)}`} sub={`${data.totals.totalSales || 0} ventas`} accent="bg-slate-900 text-white" />
            <StatCard label="Prendas Vendidas" value={`${fmt(data.totals.totalUnits || 0)}`} sub="unidades" accent="bg-blue-50 text-blue-600" />
            
            {isOwner && (
              <>
                <StatCard label="Costo Mercadería" value={`- Bs ${fmt(data.totals.totalCost || 0)}`} accent="bg-slate-100 text-slate-600" />
                <StatCard label="Comisiones Pagadas" value={`- Bs ${fmt(data.totals.totalCommissions || 0)}`} accent="bg-amber-50 text-amber-900" />
                
                {/* Nuevos KPIs de Gastos y Caja Real */}
                <StatCard label="Gastos Operativos" value={`- Bs ${fmt(totalExpensesAmount)}`} accent="bg-red-50 text-red-700" />
                
                <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Caja Real (Utilidad)</p>
                    <p className="text-2xl font-black mt-1">Bs {fmt(realNetProfit)}</p>
                    <p className="text-[10px] font-bold text-emerald-100 mt-1">Margen: {data.totals.totalRevenue > 0 ? ((realNetProfit / data.totals.totalRevenue) * 100).toFixed(1) : 0}%</p>
                </div>
              </>
            )}
          </div>

          {/* =======================
              SUB-PESTAÑAS (Ventas vs Gastos) - Solo Dueño
              ======================= */}
          {isOwner && (
              <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl mt-6">
                  <button 
                      onClick={() => setActiveSubTab('VENTAS')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'VENTAS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      Análisis de Ventas
                  </button>
                  <button 
                      onClick={() => setActiveSubTab('GASTOS')}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'GASTOS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-red-500'}`}
                  >
                      Control de Egresos
                  </button>
              </div>
          )}

          {/* =======================
              VISTA 1: ANÁLISIS DE VENTAS
              ======================= */}
          {(activeSubTab === 'VENTAS' || !isOwner) && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {data.byProduct.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center mt-4">
                      <p className="text-slate-400 font-bold">Sin ventas en este período</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Rendimiento por producto</p>
                      {data.byProduct.map((p: any) => {
                        const IconComp = Icons[p.iconKey as keyof typeof Icons] || Icons.Poleras;
                        const colorClass = PRODUCT_COLORS[p.color] || PRODUCT_COLORS.Blue;
                        const isOpen = expanded === p.productId;

                        return (
                          <div key={p.productId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : p.productId)}>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}><IconComp size={30} /></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{p.productName}</p>
                                {isOwner ? (
                                    <p className="text-xs font-bold text-emerald-600">Bs {fmt(p.totalProfit || 0)} bruto</p>
                                ) : (
                                    <p className="text-xs font-bold text-blue-600">Bs {fmt(p.totalRevenue || 0)} ingresos</p>
                                )}
                              </div>
                              <div className="text-right shrink-0 mr-1">
                                <p className="text-lg font-black text-slate-800">{p.totalQuantity || 0}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">uds</p>
                              </div>
                              {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                            </button>

                            {isOpen && (
                              <div className="px-4 pb-4 border-t border-slate-50">
                                <div className="grid grid-cols-3 gap-2 my-3">
                                  <div className={`rounded-xl p-2 text-center ${isOwner ? 'bg-slate-50' : 'bg-blue-50 col-span-3'}`}>
                                    <p className={`text-[10px] font-bold uppercase ${isOwner ? 'text-slate-400' : 'text-blue-400'}`}>Ingreso</p>
                                    <p className={`font-black text-sm ${isOwner ? 'text-slate-700' : 'text-blue-700'}`}>Bs {fmt(p.totalRevenue || 0)}</p>
                                  </div>
                                  {isOwner && (
                                    <div className="bg-red-50 rounded-xl p-2 text-center">
                                      <p className="text-[10px] text-red-400 font-bold uppercase">Costo</p>
                                      <p className="font-black text-red-700 text-sm">Bs {fmt(p.totalCost || 0)}</p>
                                    </div>
                                  )}
                                  {isOwner && (
                                    <div className="bg-emerald-50 rounded-xl p-2 text-center">
                                      <p className="text-[10px] text-emerald-400 font-bold uppercase">Utilidad</p>
                                      <p className="font-black text-emerald-700 text-sm">Bs {fmt(p.totalProfit || 0)}</p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Desglose por Talla</p>
                                <div className="space-y-2">
                                  {p.bySizeAndColor.map((sc: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                                      <span className="w-8 text-xs font-black text-slate-600 text-center">{sc.size}</span>
                                      <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-slate-500 font-bold">{sc.quantity} uds · Bs {fmt(sc.revenue || 0)}</span>
                                          {isOwner && <span className="text-emerald-600 font-black">+Bs {fmt(sc.profit || 0)}</span>}
                                        </div>
                                        {isOwner && (
                                          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-red-200">
                                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${sc.revenue > 0 ? (sc.profit / sc.revenue) * 100 : 0}%` }} />
                                          </div>
                                        )}
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

                  {data.sales && data.sales.length > 0 && (
                      <div className="mt-10 space-y-4">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                              <ReceiptText size={16} className="text-slate-400"/> Historial de Notas
                          </h3>
                          {data.sales.map((sale: any) => (
                            <div key={sale.saleId || sale.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100">
                              <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota #{sale.saleId || sale.id}</p>
                                  <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(sale.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-base font-black text-slate-800 leading-none">Bs {sale.totalRevenue || 0}</p>
                                  {isOwner && <p className="text-[10px] font-bold text-emerald-500 mt-1">Utilidad: Bs {(sale.totalProfit || 0).toFixed(2)}</p>}
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mb-3 truncate">
                                  {sale.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                              </p>
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                  <User size={12} className="text-slate-400" />
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Atendió: {sale.seller || 'N/A'}</span>
                                  {isOwner && (sale.totalCommissions || 0) > 0 && (
                                      <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                                          Comisión: Bs {(sale.totalCommissions || 0).toFixed(2)}
                                      </span>
                                  )}
                              </div>
                            </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* =======================
              VISTA 2: GASTOS / EGRESOS
              ======================= */}
          {isOwner && activeSubTab === 'GASTOS' && (
              <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-4 flex items-start gap-3">
                      <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-red-900 leading-relaxed">
                          Anota aquí el pago de servicios, alquileres, publicidad o insumos. Estos montos se restarán automáticamente de tu Utilidad para darte tu <strong className="font-black">Caja Real</strong>.
                      </p>
                  </div>

                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mt-6">Historial de Egresos</h3>
                  
                  <div className="space-y-3">
                      {expenses.length === 0 ? (
                          <p className="text-center text-sm font-bold text-slate-400 py-6">No hay gastos registrados este período.</p>
                      ) : (
                          expenses.map((exp: any) => (
                              <div key={exp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                                          <Wallet size={18} />
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-800 text-sm">{exp.concept}</p>
                                          <p className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1 mt-0.5">
                                              <Calendar size={10} /> {exp.displayDate}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span className="font-black text-red-600">- Bs {exp.amount}</span>
                                      
                                      {/* BOTÓN DE ELIMINAR -> Ahora abre el nuevo Modal */}
                                      <button 
                                          onClick={() => setDeleteConfirm({ isOpen: true, id: exp.id, concept: exp.concept })}
                                          className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Eliminar registro"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
        </>
      )}

      {/* =======================
          MODAL FLOTANTE (AGREGAR GASTO)
          ======================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)}></div>
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-black text-slate-800 mb-1">Registrar Egreso</h3>
                <p className="text-xs text-slate-500 font-medium mb-5">Añade un gasto operativo o pago.</p>
                
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Concepto / Detalle</label>
                        <input required type="text" placeholder="Ej: Pago publicidad Instagram" value={newExpense.concept} onChange={e => setNewExpense({...newExpense, concept: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Monto Pagado (Bs)</label>
                        <input required type="number" placeholder="Ej: 150" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full mt-1 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 placeholder-red-300" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-xl shadow-md hover:bg-red-700 transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* =======================
          MODAL DE CONFIRMACIÓN (ELIMINAR GASTO)
          ======================= */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Fondo oscuro desenfocado */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm({ isOpen: false, id: null, concept: '' })}></div>
            
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-[1.2rem] bg-red-100 text-red-600 flex items-center justify-center mb-5">
                    <Trash2 size={28} />
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">
                    ¿Eliminar gasto?
                </h3>
                
                <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                    Estás a punto de eliminar el registro de <strong>"{deleteConfirm.concept}"</strong>. Esta acción no se puede deshacer y el monto se devolverá a tu cálculo de Caja Real.
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteConfirm({ isOpen: false, id: null, concept: '' })} 
                        className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDeleteExpense} 
                        className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-all active:scale-95"
                    >
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};