import React, { useEffect, useState } from 'react';
import { LogOut, User, UserPlus, ShieldAlert, Users, ArrowLeft, Lock } from 'lucide-react';

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
  
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });
  // Estado inicial del nuevo usuario, por defecto SELLER
  const [newSeller, setNewSeller] = useState({ fullName: '', email: '', password: '', role: 'SELLER' });
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
      const res = await fetch(`${API_URL}/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSeller)
      });
      if (res.ok) {
        // Limpiamos el formulario y recargamos el equipo
        setNewSeller({ fullName: '', email: '', password: '', role: 'SELLER' });
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
        setPasswordData({ current: '', new: '' }); // Limpiamos los campos
      } else {
        setPwdMessage({ type: 'error', text: data.error || 'Error al actualizar contraseña' });
      }
    } catch (error) {
      setPwdMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setPwdLoading(false);
    }
  };

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

        {/* 🔒 MÓDULO DE SEGURIDAD: CAMBIAR CONTRASEÑA */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Lock size={18} className="text-slate-400" />
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Seguridad</h3>
          </div>
          <form onSubmit={handleChangePassword} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
            <div className="space-y-3">
              <input 
                required 
                type="password" 
                placeholder="Contraseña actual" 
                value={passwordData.current} 
                onChange={e => setPasswordData({...passwordData, current: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
              />
              <input 
                required 
                minLength={6}
                type="password" 
                placeholder="Nueva contraseña" 
                value={passwordData.new} 
                onChange={e => setPasswordData({...passwordData, new: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
              />
              
              {/* Mensaje de Éxito o Error */}
              {pwdMessage.text && (
                <p className={`text-xs font-bold px-3 py-2 rounded-lg text-center ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {pwdMessage.text}
                </p>
              )}

              <button 
                disabled={pwdLoading} 
                type="submit" 
                className="w-full bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-3 text-sm font-black shadow-sm hover:bg-slate-200 disabled:opacity-50 transition-all"
              >
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

            {/* Formulario Agregar Personal */}
            <form onSubmit={handleAddSeller} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 mb-4">
              <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5"><UserPlus size={14}/> Nuevo Integrante</h4>
              <div className="space-y-3">
                <input required type="text" placeholder="Nombre completo" value={newSeller.fullName} onChange={e => setNewSeller({...newSeller, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                <input required type="email" placeholder="Correo electrónico" value={newSeller.email} onChange={e => setNewSeller({...newSeller, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                <input required type="password" placeholder="Contraseña temporal" value={newSeller.password} onChange={e => setNewSeller({...newSeller, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                
                {/* SELECTOR DE ROL */}
                <select 
                  value={newSeller.role} 
                  onChange={e => setNewSeller({...newSeller, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-700"
                >
                  <option value="SELLER">Vendedor (Vende y ve su rendimiento)</option>
                  <option value="OWNER">Administrador (Acceso total)</option>
                </select>

                <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-black shadow-md hover:bg-slate-800 disabled:opacity-50 mt-2 transition-all">
                  {loading ? 'Creando...' : 'Agregar al equipo'}
                </button>
              </div>
            </form>

            {/* Lista de Equipo */}
            <div className="space-y-3">
              {team.map((member) => (
                <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-800 truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-400 font-medium truncate">{member.email}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${member.role === 'OWNER' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {member.role === 'OWNER' ? 'Admin' : 'Vendedor'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENSAJE PARA VENDEDORES */}
        {!isOwner && (
          <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5 flex items-start gap-3">
            <ShieldAlert size={24} className="text-blue-500 shrink-0" />
            <div>
              <p className="font-bold text-blue-900 text-sm">Modo Vendedor Activo</p>
              <p className="text-xs font-medium text-blue-700 mt-1 leading-relaxed">
                Como vendedor puedes registrar ventas, reponer stock y ver tu rendimiento diario en la pestaña de reportes. Solo los administradores de la empresa pueden crear nuevos productos y gestionar al personal.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}