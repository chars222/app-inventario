import React, { useState } from 'react';
import { useAuth } from './context/AuthContext'; // Importamos nuestro hook
import { Lock, Mail, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function Login() {
  const { login } = useAuth(); // Usamos la función del contexto
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Recuerda cambiar la IP por la tuya
      const res = await fetch('http://192.168.0.9:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        login(data.user); // ¡Guardamos la sesión globalmente!
      } else {
        setError(data.error || 'Error al ingresar');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-xl">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                <LayoutDashboard size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
            <p className="text-slate-500 text-sm">Ingresa a CENTRAL</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="email" 
                    placeholder="Correo" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium text-slate-800 outline-none focus:border-blue-500"
                    onChange={e => setEmail(e.target.value)}
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="password" 
                    placeholder="Contraseña" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-medium text-slate-800 outline-none focus:border-blue-500"
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 hover:scale-[1.02] transition-transform">
                Ingresar <ArrowRight size={20} />
            </button>
        </form>
      </div>
    </div>
  );
}