import React, { useEffect, useState } from 'react';
import { Check, X, Package } from 'lucide-react';
import { Icons } from './Icons';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
  onConfirm: (items: any[]) => void;
}

export default function SaleModal({ isOpen, onClose, product, onConfirm }: SaleModalProps) {
  if (!isOpen || !product) return null;

  const availableVariations = product.variations.filter((v: any) => v.stock > 0);
  const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
  const [price, setPrice] = useState(product.price);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (availableVariations.length > 0) setSelectedVarId(availableVariations[0].id);
    setPrice(product.price);
    setQty(1);
  }, [product]);

  const handleSubmit = () => {
    if (selectedVarId) {
      onConfirm([{ variationId: selectedVarId, quantity: qty, price: Number(price) }]);
      onClose();
    } else {
      setError('⚠️ Selecciona Talla');
    }
  };

  const IconComponent = Icons[product.category.iconKey as keyof typeof Icons] || Icons.Poleras;
  const colorClasses = PRODUCT_COLORS[product.color] || PRODUCT_COLORS['Blue'];

  // Sin stock disponible
  if (availableVariations.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white p-8 rounded-[2rem] text-center max-w-xs shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">¡Sin Stock!</h3>
          <p className="text-slate-500 mb-6 text-sm">No quedan tallas disponibles.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Nueva Venta</h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Icono Producto */}
        <div className="flex justify-center mb-6">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center ${colorClasses} relative`}>
            <IconComponent size={82} />
            <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              x{qty}
            </div>
          </div>
        </div>

        {/* Selección de Talla */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Selecciona Talla
          </label>
          {error && <p className="text-red-500 text-xs font-bold mb-1">{error}</p>}
          <div className="flex gap-2 flex-wrap">
            {availableVariations.map((v: any) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVarId(v.id);
                  setError('');
                }}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  selectedVarId === v.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                {v.size} <span className="text-[10px] font-normal opacity-60 ml-1">({v.stock})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cantidad */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Cantidad
          </label>
          <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              -
            </button>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full text-center text-3xl font-bold text-slate-800 bg-transparent outline-none"
            />
            <button
              onClick={() => setQty(qty + 1)}
              className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>

        {/* Precio Editable */}
        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Precio de Venta</label>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
              Editable
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-slate-400 mr-2">Bs</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-transparent text-4xl font-black text-slate-800 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Check size={24} strokeWidth={3} /> Confirmar Venta
        </button>
      </div>
    </div>
  );
}
