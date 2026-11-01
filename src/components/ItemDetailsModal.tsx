import React from 'react';
import { X, Plus, ShieldCheck, MapPin } from 'lucide-react';
import { MenuItem } from '../types/nutrition';
import { CANADIAN_CHAINS } from '../data/canadianChains';
import { NutritionLabel } from './NutritionLabel';
import { formatCAD } from '../utils/storage';

interface ItemDetailsModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToOrder: (item: MenuItem) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  onClose,
  onAddToOrder,
}) => {
  if (!item) return null;

  const chain = CANADIAN_CHAINS.find(c => c.id === item.chainId);
  const pPerDollar = item.priceCAD > 0 ? (item.protein / item.priceCAD).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                {chain?.name}
              </span>
              {item.isCanadianClassic && (
                <span className="text-[11px] text-neutral-500 font-medium">
                  · 🍁 Canadian Classic
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {item.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {item.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {item.description}
            </p>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg text-center text-xs">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">Serving</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{item.servingSize}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">Standard Price</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {formatCAD(item.priceCAD)}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase">Protein / $</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {pPerDollar}g / $ CAD
              </span>
            </div>
          </div>

          {/* Health Canada Official Nutrition Table */}
          <div className="flex justify-center pt-2">
            <NutritionLabel
              title={item.name}
              servingSize={item.servingSize}
              calories={item.calories}
              fat={item.totalFat}
              saturatedFat={item.saturatedFat}
              transFat={item.transFat}
              carbs={item.carbs}
              fiber={item.fiber}
              sugars={item.sugars}
              protein={item.protein}
              sodium={item.sodium}
              priceCAD={item.priceCAD}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Close
          </button>

          <button
            onClick={() => {
              onAddToOrder(item);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Order Tray ({formatCAD(item.priceCAD)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
