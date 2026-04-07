import React, { useEffect, useState } from 'react';
import { LogOut, User, UserPlus, ShieldAlert, Users, ArrowLeft, Lock, DollarSign, Trash2, UserX, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000'; // Ajusta a tu IP si es necesario

interface ProfileProps {
  token: string;
  user: any;
  onBack: () => void;
  logout: () => void;
}

export function ProfileView({ token, user, onBack, logout }: ProfileProps) {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false); // <-- Nuevo estado para ocultar/mostrar inactivos
  
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });
  
  // Estado inicial del nuevo usuario actualizado con los campos de comisión
  const [newSeller, setNewSeller] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    role: 'SELLER',
    commissionType: 'NONE', 
    commissionValue: '' 
  });
  
  // Estado para el Modal de Confirmación Personalizado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    memberId: number | null;
    memberName: string;
    currentStatus: boolean;
  }>({ isOpen: false, memberId: null, memberName: '', currentStatus: true });

  const isOwner = user?.role === 'OWNER';

  const fetchTeam = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTeam(await res.json());
    } catch (err) {
      console.error("Error fetching team", err);
    }
  };

  useEffect(() => {
    if (isOwner) fetchTeam();
  }, [isOwner, token]);

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...newSeller,
        commissionValue: Number(newSeller.commissionValue) || 0
      };

      const res = await fetch(`${API_URL}/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setNewSeller({ 
          fullName: '', email: '', password: '', role: 'SELLER', 
          commissionType: 'NONE', commissionValue: '' 
        });
        fetchTeam(); 
      } else {
        const err = await res.json();
        alert(err.error || "Error al crear usuario");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!confirmModal.memberId) return;
    
    const { memberId, currentStatus } = confirmModal;
    const actionText = currentStatus ? 'dar de baja' : 'reactivar';
    
    setConfirmModal({ ...confirmModal, isOpen: false });
    
    try {
      const res = await fetch(`${API_URL}/users/${memberId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (res.ok) {
        fetchTeam(); 
      } else {
        const err = await res.json();
        alert(err.error || `Error al ${actionText} usuario`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al intentar actualizar estado");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.new })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPwdMessage({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
        setPasswordData({ current: '', new: '' }); 
      } else {
        setPwdMessage({ type: 'error', text: data.error || 'Error al actualizar contraseña' });
      }
    } catch (error) {
      setPwdMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setPwdLoading(false);
    }
  };

  // --- FILTROS DE EQUIPO ---
  // Consideramos "activo" a quien tenga isActive en true, o si no viene el campo (para compatibilidad antigua)
  const activeTeam = team.filter(m => m.isActive !== false);
  const inactiveTeam = team.filter(m => m.isActive === false);

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-10 font-sans text-slate-900">
      {/* HEADER FIJO */}
      <div className="sticky top-0 z-20 bg-[#F4F6F9] pt-8 px-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">Mi Perfil</h1>
            <p className="text-xs text-slate-400 font-bold mt-0.5">{user.businessName}</p>
          </div>
        </div>
        <button onClick={logout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-red-100 hover:bg-red-100 transition-colors">
          <LogOut size={14} strokeWidth={3} /> Salir
        </button>
      </div>

      <div className="px-5 mt-4 space-y-6">
        
        {/* TARJETA DEL USUARIO ACTUAL */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white/60 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center border-4 border-blue-50 shrink-0">
            <User size={32} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-slate-800 leading-tight truncate">{user.fullName}</h2>
            <p className="text-sm font-bold text-slate-400 truncate">{user.email}</p>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isOwner ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              Rol: {isOwner ? 'Administrador' : 'Vendedor'}
            </span>
          </div>
        </div>

        {/* 🔒 MÓDULO DE SEGURIDAD */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Lock size={18} className="text-slate-400" />
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Seguridad</h3>
          </div>
          <form onSubmit={handleChangePassword} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
            <div className="space-y-3">
              <input required type="password" placeholder="Contraseña actual" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              <input required minLength={6} type="password" placeholder="Nueva contraseña" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              {pwdMessage.text && (
                <p className={`text-xs font-bold px-3 py-2 rounded-lg text-center ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {pwdMessage.text}
                </p>
              )}
              <button disabled={pwdLoading} type="submit" className="w-full bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-3 text-sm font-black shadow-sm hover:bg-slate-200 disabled:opacity-50 transition-all">
                {pwdLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        </div>

        {/* GESTIÓN DE EQUIPO (SOLO DUEÑOS/ADMINS) */}
        {isOwner && (
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Users size={18} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Equipo de Trabajo</h3>
            </div>

            <form onSubmit={handleAddSeller} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 mb-6">
              <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5"><UserPlus size={14}/> Nuevo Integrante</h4>
              <div className="space-y-3">
                <input required type="text" placeholder="Nombre completo" value={newSeller.fullName} onChange={e => setNewSeller({...newSeller, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
                <input required type="email" placeholder="Correo electrónico" value={newSeller.email} onChange={e => setNewSeller({...newSeller, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
                <input required type="password" placeholder="Contraseña temporal" value={newSeller.password} onChange={e => setNewSeller({...newSeller, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
                
                <select value={newSeller.role} onChange={e => setNewSeller({...newSeller, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 text-slate-700">
                  <option value="SELLER">Vendedor (Vende y ve su rendimiento)</option>
                  <option value="OWNER">Administrador (Acceso total)</option>
                </select>

                <div className="pt-3 pb-1 border-t border-slate-100 mt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-2">
                    <DollarSign size={12}/> Beneficios por Venta
                  </h4>
                  <select value={newSeller.commissionType} onChange={e => setNewSeller({...newSeller, commissionType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 text-slate-700 mb-3">
                      <option value="NONE">Sin Comisiones extras</option>
                      <option value="FIXED">Comisión: Monto Fijo por Prenda</option>
                      <option value="PERCENTAGE">Comisión: Porcentaje por Venta (%)</option>
                  </select>
                  {newSeller.commissionType !== 'NONE' && (
                      <input required type="number" step="0.1" placeholder={newSeller.commissionType === 'FIXED' ? "Ej: 5 (Bs por prenda)" : "Ej: 10 (% de la venta)"} value={newSeller.commissionValue} onChange={e => setNewSeller({...newSeller, commissionValue: e.target.value})} className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-2.5 text-sm font-black focus:outline-none focus:border-emerald-500 placeholder-emerald-300" />
                  )}
                </div>

                <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-black shadow-md hover:bg-slate-800 disabled:opacity-50 mt-2 transition-all">
                  {loading ? 'Creando...' : 'Agregar al equipo'}
                </button>
              </div>
            </form>

            {/* LISTA DE EQUIPO ACTIVO */}
            <div className="space-y-3">
              {activeTeam.map((member) => (
                <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="min-w-0 pr-3 flex-1">
                    <p className="font-bold text-slate-800 truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-400 font-medium truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${member.role === 'OWNER' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {member.role === 'OWNER' ? 'Admin' : 'Vendedor'}
                    </span>
                    
                    {/* Botón de suspender (solo visible si no es él mismo) */}
                    {member.id !== user.id && (
                      <button 
                        onClick={() => setConfirmModal({
                          isOpen: true, memberId: member.id, memberName: member.fullName, currentStatus: true
                        })}
                        className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Dar de baja"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* SECCIÓN DESPLEGABLE DE INACTIVOS */}
            {inactiveTeam.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <button 
                  onClick={() => setShowInactive(!showInactive)}
                  className="w-full flex items-center justify-between bg-slate-100 px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Personal Dado de Baja ({inactiveTeam.length})</span>
                  {showInactive ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                {showInactive && (
                  <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                    {inactiveTeam.map((member) => (
                      <div key={member.id} className="bg-white/50 p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between opacity-80 grayscale-[30%]">
                        <div className="min-w-0 pr-3 flex-1">
                          <p className="font-bold text-slate-500 line-through truncate">{member.fullName}</p>
                          <p className="text-xs text-slate-400 font-medium truncate">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-red-100 text-red-600">
                            Inactivo
                          </span>
                          
                          {/* Botón de REACTIVAR */}
                          <button 
                            onClick={() => setConfirmModal({
                              isOpen: true, memberId: member.id, memberName: member.fullName, currentStatus: false
                            })}
                            className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                            title="Reactivar Usuario"
                          >
                            <UserCheck size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MENSAJE PARA VENDEDORES */}
        {!isOwner && (
          <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5 flex items-start gap-3">
            <ShieldAlert size={24} className="text-blue-500 shrink-0" />
            <div>
              <p className="font-bold text-blue-900 text-sm">Modo Vendedor Activo</p>
              <p className="text-xs font-medium text-blue-700 mt-1 leading-relaxed">
                Como vendedor puedes registrar ventas, reponer stock y ver tu rendimiento diario. Solo los administradores pueden gestionar al personal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center mb-5 ${confirmModal.currentStatus ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {confirmModal.currentStatus ? <UserX size={28} /> : <UserCheck size={28} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">
              {confirmModal.currentStatus ? '¿Dar de baja a' : '¿Reactivar a'} {confirmModal.memberName}?
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              {confirmModal.currentStatus
                ? 'El usuario ya no podrá acceder al sistema, pero su historial de ventas se mantendrá para la auditoría.'
                : 'El usuario volverá a tener acceso al sistema con su rol y permisos previamente asignados.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmToggleStatus} className={`flex-1 py-3.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${confirmModal.currentStatus ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmModal.currentStatus ? 'Sí, dar de baja' : 'Sí, reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}