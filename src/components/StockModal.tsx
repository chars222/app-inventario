import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Icons } from './Icons';

const SIZE_SCALES: Record<string, string[]> = {
  'LETTER': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'NUMERIC': ['36', '38', '40', '42', '44', '46', '48'],
  'SHOES': ['38', '39', '40', '41', '42', '43', '44']
};

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};


interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
  onConfirm: (productId: number, size: string, qty: number, newPrice?: string) => void;
}

export default function StockModal({ isOpen, onClose, product, onConfirm }: StockModalProps) {
  if (!isOpen || !product) return null;

  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  const IconComponent = Icons[product.category.iconKey as keyof typeof Icons] || Icons.Poleras;
  const currentScale = SIZE_SCALES[product.category.sizeType] || SIZE_SCALES['LETTER'];
  const colorClasses = PRODUCT_COLORS[product.color] || PRODUCT_COLORS['Blue'];

  const handleSubmit = () => {
    if (!size) {
      setError('⚠️ ¡Selecciona una talla primero!');
      return;
    }
    onConfirm(product.id, size, qty, newPrice);
    setError('');
    setNewPrice('');
    setSize('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-slate-800 mb-6">Reponer Stock</h3>

        {/* Resumen Producto */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center ${colorClasses} shadow-sm`}>
            <IconComponent size={28} />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{product.name}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">Stock Total: {product.totalStock}</p>
          </div>
        </div>

        {/* Selección de Talla */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talla</label>
            {error && <span className="text-xs font-bold text-red-500 animate-pulse">{error}</span>}
          </div>
          <div
            className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${
              error ? 'p-1 bg-red-50 rounded-xl border border-red-100' : ''
            }`}
          >
            {currentScale.map((s) => {
              const existingVar = product.variations.find((v: any) => v.size === s);
              const currentStock = existingVar ? existingVar.stock : 0;
              const hasStock = currentStock > 0;

              return (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setError('');
                  }}
                  className={`relative px-4 py-3 rounded-xl font-bold transition-all text-sm whitespace-nowrap border-2 flex flex-col items-center min-w-[60px] ${
                    size === s
                      ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105 z-10'
                      : hasStock
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-400'
                      : 'bg-white text-slate-300 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">{s}</span>
                  {hasStock && size !== s && (
                    <span className="text-[10px] font-normal mt-0.5 opacity-80">{currentStock}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cantidad y Precio */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Cantidad
            </label>
            <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold text-slate-500"
              >
                -
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full text-center font-bold text-slate-800 bg-transparent outline-none"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 bg-white rounded-xl shadow-sm font-bold text-slate-500"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nuevo Precio
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">Bs</span>
              <input
                type="number"
                placeholder={String(product.price)}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 pl-8 font-bold text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-4 font-bold rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
            size
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus size={24} strokeWidth={3} /> {size ? 'Confirmar Ingreso' : 'Elige una talla'}
        </button>
      </div>
    </div>
  );
}
