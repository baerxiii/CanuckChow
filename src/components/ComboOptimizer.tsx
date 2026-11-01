import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Plus,
  Flame,
  DollarSign,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { CanadianChainId, MenuItem, OrderItem } from '../types/nutrition';
import { CANADIAN_CHAINS, MENU_DATABASE } from '../data/canadianChains';
import { formatCAD } from '../utils/storage';

interface ComboOptimizerProps {
  allItems: MenuItem[];
  onAddComboToOrder: (items: MenuItem[]) => void;
  onNavigateToBuilder: () => void;
}

interface GeneratedCombo {
  id: string;
  chainName: string;
  chainId: CanadianChainId;
  title: string;
  items: MenuItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalCostCAD: number;
  proteinPerDollar: number;
  benefitBadge: string;
}

export const ComboOptimizer: React.FC<ComboOptimizerProps> = ({
  allItems,
  onAddComboToOrder,
  onNavigateToBuilder
}) => {
  const [selectedChain, setSelectedChain] = useState<CanadianChainId | 'all'>('all');
  const [maxCalories, setMaxCalories] = useState<number>(750);
  const [minProtein, setMinProtein] = useState<number>(30);
  const [maxBudgetCAD, setMaxBudgetCAD] = useState<number>(16.0);
  const [optimizationPriority, setOptimizationPriority] = useState<'protein-per-dollar' | 'leanest-macros' | 'budget'>('protein-per-dollar');

  // Generate combo combinations algorithm
  const generatedCombos = useMemo(() => {
    const candidateCombos: GeneratedCombo[] = [];

    // Filter available items
    const pool = allItems.filter(i => {
      if (selectedChain !== 'all' && i.chainId !== selectedChain) return false;
      return true;
    });

    // 1. Single powerhouse items
    pool.forEach(item => {
      if (
        item.calories <= maxCalories &&
        item.protein >= minProtein &&
        item.priceCAD <= maxBudgetCAD
      ) {
        const pPerD = item.priceCAD > 0 ? item.protein / item.priceCAD : 0;
        const chain = CANADIAN_CHAINS.find(c => c.id === item.chainId);
        candidateCombos.push({
          id: `single-${item.id}`,
          chainName: chain?.name || 'Fast Food',
          chainId: item.chainId,
          title: `${item.name} (Solo Powerhouse)`,
          items: [item],
          totalCalories: item.calories,
          totalProtein: item.protein,
          totalCarbs: item.carbs,
          totalFat: item.totalFat,
          totalCostCAD: item.priceCAD,
          proteinPerDollar: +pPerD.toFixed(1),
          benefitBadge: 'Standalone Value'
        });
      }
    });

    // 2. Main + Drink / Side 2-item pairings
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const a = pool[i];
        const b = pool[j];

        // Ensure from same chain
        if (a.chainId !== b.chainId) continue;

        const comboCals = a.calories + b.calories;
        const comboProtein = a.protein + b.protein;
        const comboCost = +(a.priceCAD + b.priceCAD).toFixed(2);

        if (
          comboCals <= maxCalories &&
          comboProtein >= minProtein &&
          comboCost <= maxBudgetCAD
        ) {
          const chain = CANADIAN_CHAINS.find(c => c.id === a.chainId);
          const pPerD = comboCost > 0 ? comboProtein / comboCost : 0;

          candidateCombos.push({
            id: `pair-${a.id}-${b.id}`,
            chainName: chain?.name || 'Combo',
            chainId: a.chainId,
            title: `${a.name} + ${b.name}`,
            items: [a, b],
            totalCalories: comboCals,
            totalProtein: comboProtein,
            totalCarbs: a.carbs + b.carbs,
            totalFat: a.totalFat + b.totalFat,
            totalCostCAD: comboCost,
            proteinPerDollar: +pPerD.toFixed(1),
            benefitBadge: comboProtein >= 40 ? 'High Protein Combo' : 'Balanced Pair'
          });
        }
      }
    }

    // Sort by selected priority
    return candidateCombos
      .sort((a, b) => {
        if (optimizationPriority === 'protein-per-dollar') {
          return b.proteinPerDollar - a.proteinPerDollar;
        } else if (optimizationPriority === 'leanest-macros') {
          // highest protein to calorie ratio
          const ratioA = a.totalProtein / (a.totalCalories || 1);
          const ratioB = b.totalProtein / (b.totalCalories || 1);
          return ratioB - ratioA;
        } else {
          return a.totalCostCAD - b.totalCostCAD;
        }
      })
      .slice(0, 12);
  }, [selectedChain, maxCalories, minProtein, maxBudgetCAD, optimizationPriority]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Smart Fast Food Order Recommender
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">
                Nutritional Constraint Optimizer
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
              Canadian Fast Food Combo Optimizer
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Specify your calorie limit, protein target, and budget in CAD. We calculate the most macro-efficient orders.
            </p>
          </div>
        </div>

        {/* Optimizer Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          {/* Chain Selector */}
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Canadian Chain
            </label>
            <select
              value={selectedChain}
              onChange={e => setSelectedChain(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
            >
              <option value="all">Any Canadian Chain</option>
              {CANADIAN_CHAINS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Calories Slider */}
          <div>
            <div className="flex justify-between font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>Max Calories:</span>
              <span className="font-mono text-red-600 dark:text-red-400">{maxCalories} kcal</span>
            </div>
            <input
              type="range"
              min="350"
              max="1400"
              step="50"
              value={maxCalories}
              onChange={e => setMaxCalories(Number(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Min Protein Slider */}
          <div>
            <div className="flex justify-between font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>Min Protein:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">&ge; {minProtein}g</span>
            </div>
            <input
              type="range"
              min="15"
              max="65"
              step="5"
              value={minProtein}
              onChange={e => setMinProtein(Number(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Max Budget Slider */}
          <div>
            <div className="flex justify-between font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              <span>Max Budget:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                &le; ${maxBudgetCAD} CAD
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={maxBudgetCAD}
              onChange={e => setMaxBudgetCAD(Number(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>
        </div>

        {/* Priority Segmented Control */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <span className="text-neutral-500">Optimization Goal:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setOptimizationPriority('protein-per-dollar')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                optimizationPriority === 'protein-per-dollar'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Max Protein / $ CAD
            </button>
            <button
              onClick={() => setOptimizationPriority('leanest-macros')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                optimizationPriority === 'leanest-macros'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Leanest (Protein:Calorie Ratio)
            </button>
            <button
              onClick={() => setOptimizationPriority('budget')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                optimizationPriority === 'budget'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Cheapest Overall
            </button>
          </div>
        </div>
      </div>

      {/* Generated Combos Results */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-neutral-500">
          <span>Found {generatedCombos.length} matching combo solutions</span>
          <span>Sorted by {optimizationPriority.replace(/-/g, ' ')}</span>
        </div>

        {generatedCombos.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">
            No fast food combos found matching these strict criteria. Try raising the calorie ceiling or budget slightly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedCombos.map((combo, idx) => {
              return (
                <div
                  key={combo.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        {combo.chainName}
                      </span>
                      <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                        {formatCAD(combo.totalCostCAD)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                      {combo.title}
                    </h3>

                    {/* Items included */}
                    <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                      {combo.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate pr-2">• {item.name}</span>
                          <span className="font-mono shrink-0">{item.calories} cal</span>
                        </div>
                      ))}
                    </div>

                    {/* Nutrient box */}
                    <div className="grid grid-cols-4 gap-1 mt-3 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg text-center text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-neutral-400 block">KCAL</span>
                        <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                          {combo.totalCalories}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 block">PROTEIN</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                          {combo.totalProtein}g
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 block">CARBS</span>
                        <span className="text-neutral-600 dark:text-neutral-300 tabular-nums">
                          {combo.totalCarbs}g
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 block">FAT</span>
                        <span className="text-neutral-600 dark:text-neutral-300 tabular-nums">
                          {combo.totalFat}g
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-500 mt-2 font-mono">
                      <span>Value Yield:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {combo.proteinPerDollar}g Protein / $ CAD
                      </span>
                    </div>
                  </div>

                  {/* Add combo action */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => onAddComboToOrder(combo.items)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Load into Order Tray</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
