import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.9:3000';

export default function ForgotPassword({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Error de conexión');
      }
    } catch (err) {
      setError('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-50 text-blue-600">
            <Mail size={32} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Recuperar acceso</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center shadow-sm">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="font-black text-emerald-800 mb-2">¡Correo enviado!</h3>
            <p className="text-sm font-medium text-emerald-600 mb-6">
              Revisa tu bandeja de entrada o la carpeta de spam para encontrar el enlace de recuperación.
            </p>
            <button onClick={onBackToLogin} className="w-full py-3 bg-white text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-800"
                  placeholder="ejemplo@empresa.com"
                />
              </div>

              {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white rounded-xl py-3.5 text-sm font-black shadow-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}