import React, { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';

export default function ResetPassword({ token, onLogin }: { token: string, onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'El enlace es inválido o ha expirado.');
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-50 text-emerald-600">
            <Lock size={32} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Crea tu nueva clave</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Por seguridad, tu nueva contraseña debe tener al menos 6 caracteres.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center shadow-sm">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="font-black text-emerald-800 mb-2">¡Todo listo!</h3>
            <p className="text-sm font-medium text-emerald-600 mb-6">
              Tu contraseña ha sido actualizada con éxito. Ya puedes volver a tu empresa.
            </p>
            <button onClick={onLogin} className="w-full py-3.5 bg-slate-900 text-white font-black rounded-xl shadow-md hover:bg-slate-800 transition-colors active:scale-95">
              Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white rounded-xl py-3.5 text-sm font-black shadow-md hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}