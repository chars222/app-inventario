import React, { useState } from 'react';
import { Building2, User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
// 1. IMPORTA EL HOOK
import { useAuth } from './context/AuthContext'; 

const API_URL = 'http://192.168.0.9:3000';

export default function Register() { // Ya no necesitamos props aquí necesariamente
  const { login } = useAuth(); // 2. SACAMOS LA FUNCIÓN LOGIN DEL CONTEXTO
  
  const [form, setForm] = useState({
    businessName: '',
    fullName: '',
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 3. ¡MAGIA! USAMOS EL CONTEXTO DIRECTAMENTE
        // Esto actualizará el estado global 'user' y 'token'
        // Lo que provocará que App.tsx desmonte Register y monte el Dashboard automáticamente.
        login(data.user, data.token); 
        
      } else {
        setError(data.error || 'Error al registrar.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-600/30">
                <Building2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Crea tu Negocio</h1>
            <p className="text-slate-500">Empieza a gestionar tu inventario hoy.</p>
        </div>

        {/* 3. ALERTA VISUAL DE ERROR */}
        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-pulse">
                <AlertCircle size={18} />
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre Empresa */}
            <div className="relative">
                <Building2 className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Nombre de tu Tienda (ej. CENTRAL)" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    onChange={e => setForm({...form, businessName: e.target.value})}
                />
            </div>

            <div className="border-t border-slate-100 my-2"></div>

            {/* Datos Usuario */}
            <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Tu Nombre Completo" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    onChange={e => setForm({...form, fullName: e.target.value})}
                />
            </div>
            <div className="relative">
                <Mail className={`absolute left-4 top-3.5 ${error ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                <input 
                    type="email" 
                    placeholder="Correo Electrónico" 
                    // Si hay error, pintamos el borde rojo para indicar qué falló
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-12 pr-4 font-medium text-slate-800 focus:ring-2 outline-none ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500'}`}
                    required
                    onChange={e => {
                        setForm({...form, email: e.target.value});
                        setError(''); // Limpiar error cuando el usuario empieza a corregir
                    }}
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="password" 
                    placeholder="Contraseña" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    onChange={e => setForm({...form, password: e.target.value})}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-6 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Creando...' : 'Comenzar'} 
                {!loading && <ArrowRight size={20} />}
            </button>
        </form>
      </div>
    </div>
  );
}