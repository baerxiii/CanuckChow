import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { UserGoals } from '../types/nutrition';
import { CANADIAN_PROVINCE_TAXES } from '../data/canadianChains';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoals;
  onSave: (newGoals: UserGoals) => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  goals,
  onSave,
}) => {
  const [calories, setCalories] = useState(goals.calories);
  const [protein, setProtein] = useState(goals.protein);
  const [carbs, setCarbs] = useState(goals.carbs);
  const [fat, setFat] = useState(goals.fat);
  const [sodiumLimit, setSodiumLimit] = useState(goals.sodiumLimit);
  const [monthlyBudgetCAD, setMonthlyBudgetCAD] = useState(goals.monthlyBudgetCAD);
  const [provinceCode, setProvinceCode] = useState(goals.provinceCode);

  if (!isOpen) return null;

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setProvinceCode(code);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const prov = CANADIAN_PROVINCE_TAXES.find(p => p.code === provinceCode) || CANADIAN_PROVINCE_TAXES[0];
    onSave({
      calories: Number(calories) || 2000,
      protein: Number(protein) || 120,
      carbs: Number(carbs) || 200,
      fat: Number(fat) || 65,
      sodiumLimit: Number(sodiumLimit) || 2300,
      monthlyBudgetCAD: Number(monthlyBudgetCAD) || 200,
      provinceCode: prov.code,
      taxRate: prov.rate
    });
    onClose();
  };

  // Macro calorie math
  const macroCalories = protein * 4 + carbs * 4 + fat * 9;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Daily Macro & Budget Targets
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Personalize calorie limits, macronutrient splits, and Canadian dining budget
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Calorie Goal */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Daily Calorie Target (kcal)
              </label>
              <span className="text-xs font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                {calories} kcal
              </span>
            </div>
            <input
              type="number"
              min="1000"
              max="5000"
              step="50"
              value={calories}
              onChange={e => setCalories(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              required
            />
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                min="30"
                max="350"
                value={protein}
                onChange={e => setProtein(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block font-mono">
                {protein * 4} kcal ({Math.round(((protein * 4) / (macroCalories || 1)) * 100)}%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={carbs}
                onChange={e => setCarbs(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block font-mono">
                {carbs * 4} kcal ({Math.round(((carbs * 4) / (macroCalories || 1)) * 100)}%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={fat}
                onChange={e => setFat(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block font-mono">
                {fat * 9} kcal ({Math.round(((fat * 9) / (macroCalories || 1)) * 100)}%)
              </span>
            </div>
          </div>

          {/* Sodium limit */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Sodium Alert Threshold (mg)
              </label>
              <span className="text-xs text-neutral-500 font-mono">
                Health Canada recommends &le; 2,300mg
              </span>
            </div>
            <input
              type="number"
              min="1000"
              max="5000"
              step="100"
              value={sodiumLimit}
              onChange={e => setSodiumLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              required
            />
          </div>

          {/* Financial & Province Budget */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Monthly Fast Food Spend Budget ($ CAD)
                </label>
                <span className="text-xs font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                  ${monthlyBudgetCAD} CAD
                </span>
              </div>
              <input
                type="number"
                min="20"
                max="2000"
                step="10"
                value={monthlyBudgetCAD}
                onChange={e => setMonthlyBudgetCAD(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Canadian Province / Territory (Sales Tax)
              </label>
              <select
                value={provinceCode}
                onChange={handleProvinceChange}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {CANADIAN_PROVINCE_TAXES.map(prov => (
                  <option key={prov.code} value={prov.code}>
                    {prov.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-500 mt-1">
                Used to calculate accurate after-tax totals and receipt breakdowns.
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
