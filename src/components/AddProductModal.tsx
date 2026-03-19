import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Icons } from './Icons';

const PRODUCT_COLORS: Record<string, string> = {
  'Blue': 'text-blue-600 bg-blue-50',
  'Navy': 'text-indigo-800 bg-indigo-50',
  'Red': 'text-red-600 bg-red-50',
  'Black': 'text-slate-800 bg-slate-100',
  'White': 'text-slate-100 bg-white border-2 border-slate-100',
  'Green': 'text-emerald-600 bg-emerald-50',
};

const SIZE_SCALES: Record<string, string[]> = {
  'LETTER': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'NUMERIC': ['36', '38', '40', '42', '44', '46', '48'],
  'SHOES': ['38', '39', '40', '41', '42', '43', '44']
};

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formData: any) => void;
  categories: any[];
}

export default function AddProductModal({
  isOpen,
  onClose,
  onConfirm,
  categories,
}: AddProductModalProps) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    name: '',
    cost: '',
    price: '',
    quantity: '',
    categoryId: null as number | null,
    color: 'Blue',
  });

  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());

  const handleCategorySelect = (cat: any) => {
    setForm({ ...form, categoryId: cat.id });
    setActiveCategory(cat);
    setSelectedSizes(new Set()); // Limpiar tallas al cambiar categoría
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = new Set(selectedSizes);
    if (newSizes.has(size)) {
      newSizes.delete(size);
    } else {
      newSizes.add(size);
    }
    setSelectedSizes(newSizes);
  };

  const handleSubmit = () => {
    if (!form.name || !form.cost || !form.price || !form.categoryId || selectedSizes.size === 0 || !form.quantity) return;
    
    // Distribuir la cantidad equitativamente entre las tallas seleccionadas
    const quantityPerSize = Math.floor(Number(form.quantity) / selectedSizes.size);
    const remainder = Number(form.quantity) % selectedSizes.size;
    
    // Convertir selectedSizes a array de variaciones
    let index = 0;
    const variations = Array.from(selectedSizes).map(size => ({
      size,
      stock: quantityPerSize + (index++ < remainder ? 1 : 0)
    }));

    onConfirm({
      ...form,
      cost: Number(form.cost),
      price: Number(form.price),
      quantity: Number(form.quantity),
      variations
    });
    onClose();
    setForm({ name: '', cost: '', price: '', quantity: '', categoryId: null, color: 'Blue' });
    setActiveCategory(null);
    setSelectedSizes(new Set());
  };

  const PreviewIcon = activeCategory
    ? Icons[activeCategory.iconKey as keyof typeof Icons]
    : Icons.Poleras;

  const previewColorClass = PRODUCT_COLORS[form.color] || PRODUCT_COLORS['Blue'];
  const currentSizeScale = activeCategory 
    ? SIZE_SCALES[activeCategory.sizeType] || SIZE_SCALES['LETTER']
    : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl h-[90vh] sm:h-auto overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Crear Producto</h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Previsualización */}
        <div className="flex justify-center mb-6">
          <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-300 ${previewColorClass}`}>
            <PreviewIcon size={64} />
          </div>
        </div>

        {/* Campos de Texto */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Nombre del Producto
            </label>
            <input
              type="text"
              placeholder="Ej. Polera Estampada"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Costo (Bs)
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Precio (Bs)
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Cantidad Inicial
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-1">Se distribuirá equitativamente entre las tallas seleccionadas</p>
          </div>
        </div>

        {/* Selección de Categoría */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Categoría
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat: any) => {
              console.log(cat);
              const CatIcon = Icons[cat.iconKey as keyof typeof Icons] || Icons.Poleras;
              const isActive = form.categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex flex-col items-center gap-2 min-w-[70px] p-3 rounded-2xl border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <CatIcon size={24} />
                  <span className="text-[10px] font-bold truncate w-full text-center">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selección de Tallas */}
        {activeCategory && (
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Tallas Disponibles
            </label>
            <div className="flex gap-2 flex-wrap">
              {currentSizeScale.map((size: string) => {
                const isSelected = selectedSizes.has(size);
                return (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`px-3 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {size}
                    {isSelected && <Check size={14} className="inline ml-1" />}
                  </button>
                );
              })}
            </div>
            {selectedSizes.size === 0 && (
              <p className="text-xs text-red-500 font-bold mt-2">⚠️ Selecciona al menos una talla</p>
            )}
          </div>
        )}

        {/* Selección de Color */}
        <div className="mb-8">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Color Principal
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Object.keys(PRODUCT_COLORS).map((colorKey) => {
              const bgMap: Record<string, string> = {
                'Blue': 'bg-blue-500',
                'Navy': 'bg-indigo-900',
                'Red': 'bg-red-500',
                'Black': 'bg-slate-900',
                'White': 'bg-white border border-slate-200',
                'Green': 'bg-emerald-500',
              };

              const isSelected = form.color === colorKey;

              return (
                <button
                  key={colorKey}
                  onClick={() => setForm({ ...form, color: colorKey })}
                  className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-transform ${bgMap[colorKey]} ${
                    isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                >
                  {isSelected && (
                    <Check
                      size={16}
                      className={colorKey === 'White' ? 'text-slate-900' : 'text-white'}
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.categoryId || !form.name || !form.cost || !form.price || !form.quantity || selectedSizes.size === 0}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Crear Producto
        </button>
      </div>
    </div>
  );
}
