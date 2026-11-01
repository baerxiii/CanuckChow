import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Info,
  ArrowUpDown,
  Scale,
  X,
  ExternalLink,
  MapPin,
  Calendar
} from 'lucide-react';
import {
  CanadianChainId,
  FoodCategory,
  MenuItem,
  OrderItem
} from '../types/nutrition';
import {
  CANADIAN_CHAINS,
  CATEGORY_LABELS,
  MENU_DATABASE
} from '../data/canadianChains';
import { formatCAD } from '../utils/storage';
import { NutritionLabel } from './NutritionLabel';

interface ChainExplorerProps {
  allItems: MenuItem[];
  onAddItemToTray: (item: MenuItem) => void;
  onViewDetails: (item: MenuItem) => void;
  onOpenImportModal: () => void;
}

export const ChainExplorer: React.FC<ChainExplorerProps> = ({
  allItems,
  onAddItemToTray,
  onViewDetails,
  onOpenImportModal,
}) => {
  const [selectedChain, setSelectedChain] = useState<CanadianChainId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'protein-desc' | 'calories-asc' | 'calories-desc' | 'price-asc' | 'value-desc'>('protein-desc');
  const [onlyHighProtein, setOnlyHighProtein] = useState(false);
  const [onlyClassics, setOnlyClassics] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(25);

  // Comparison state (up to 2 items)
  const [compareItems, setCompareItems] = useState<MenuItem[]>([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);

  // Filter items
  const filteredItems = allItems.filter(item => {
    if (selectedChain !== 'all' && item.chainId !== selectedChain) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (onlyHighProtein && item.protein < 25) return false;
    if (onlyClassics && !item.isCanadianClassic) return false;
    if (item.priceCAD > maxPrice) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const chainName = CANADIAN_CHAINS.find(c => c.id === item.chainId)?.name.toLowerCase() || '';
      return (
        item.name.toLowerCase().includes(q) ||
        chainName.includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'protein-desc') return b.protein - a.protein;
    if (sortBy === 'calories-asc') return a.calories - b.calories;
    if (sortBy === 'calories-desc') return b.calories - a.calories;
    if (sortBy === 'price-asc') return a.priceCAD - b.priceCAD;
    if (sortBy === 'value-desc') {
      const valA = a.priceCAD > 0 ? a.protein / a.priceCAD : 0;
      const valB = b.priceCAD > 0 ? b.protein / b.priceCAD : 0;
      return valB - valA;
    }
    return 0;
  });

  const toggleCompare = (item: MenuItem) => {
    if (compareItems.some(i => i.id === item.id)) {
      setCompareItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      if (compareItems.length >= 2) {
        setCompareItems([compareItems[1], item]);
      } else {
        setCompareItems(prev => [...prev, item]);
      }
      setShowCompareDrawer(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Canadian Quick-Serve & Fast Casual Directory
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500 font-mono">
                {CANADIAN_CHAINS.length} Chains · {allItems.length} Available Items
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
              Canadian Fast Food Nutrition & Value Explorer
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Compare protein, calories, sodium, and pricing across Canada's most popular chains.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import / Add Foods</span>
            </button>

            {compareItems.length > 0 && (
              <button
                onClick={() => setShowCompareDrawer(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Scale className="w-4 h-4 text-red-600" />
                <span>Comparing {compareItems.length}/2 Items</span>
              </button>
            )}
          </div>
        </div>

        {/* Chain quick filter grid */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedChain('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedChain === 'all'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Chains ({allItems.length})
          </button>
          {CANADIAN_CHAINS.map(chain => {
            const isSelected = selectedChain === chain.id;
            const chainItemCount = allItems.filter(i => i.chainId === chain.id).length;
            return (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {chain.name} ({chainItemCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search items by name, burger, chicken, poutine..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as FoodCategory | 'all')}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Food Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            >
              <option value="protein-desc">Highest Protein (g)</option>
              <option value="value-desc">Best Protein / $ CAD</option>
              <option value="calories-asc">Lowest Calories</option>
              <option value="calories-desc">Highest Calories</option>
              <option value="price-asc">Lowest Price ($ CAD)</option>
            </select>
          </div>
        </div>

        {/* Toggles row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyHighProtein}
                onChange={e => setOnlyHighProtein(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                High Protein (&ge;25g)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyClassics}
                onChange={e => setOnlyClassics(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                🍁 Canadian Classics Only
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Max Price:</span>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="accent-red-600 w-24 sm:w-32"
            />
            <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
              &le; ${maxPrice} CAD
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Drawer / Modal */}
      {showCompareDrawer && compareItems.length > 0 && (
        <div className="bg-neutral-900 text-white rounded-xl p-5 shadow-lg border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold">
                Head-to-Head Canadian Fast Food Comparison
              </h3>
            </div>
            <button
              onClick={() => setShowCompareDrawer(false)}
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {compareItems.length === 1 ? (
            <div className="p-4 bg-neutral-800/60 rounded-lg text-xs text-neutral-300">
              Select one more item using the "Compare" button on any card below to see a direct side-by-side nutritional & cost showdown.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {compareItems.map(item => {
                const chain = CANADIAN_CHAINS.find(c => c.id === item.chainId);
                const pPerDollar = item.priceCAD > 0 ? (item.protein / item.priceCAD).toFixed(1) : '0';
                return (
                  <div key={item.id} className="p-4 bg-neutral-800 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] text-red-400 font-semibold uppercase">
                          {chain?.name}
                        </span>
                        <h4 className="text-sm font-bold truncate">{item.name}</h4>
                      </div>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {formatCAD(item.priceCAD)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-neutral-700">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Calories:</span>
                        <span className="font-bold text-sm text-white">{item.calories} kcal</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Protein:</span>
                        <span className="font-bold text-sm text-blue-400">{item.protein}g</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Carbs / Fat:</span>
                        <span>{item.carbs}g / {item.totalFat}g</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[10px]">Protein / $ CAD:</span>
                        <span className="font-bold text-emerald-400">{pPerDollar}g / $</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map(item => {
          const chain = CANADIAN_CHAINS.find(c => c.id === item.chainId);
          const isComparing = compareItems.some(i => i.id === item.id);
          const pPerDollar = item.priceCAD > 0 ? (item.protein / item.priceCAD).toFixed(1) : '0';

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
            >
              <div>
                {/* Chain & Tagline */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                    {chain?.name}
                  </span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                    {formatCAD(item.priceCAD)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Nutrition Metric Strip */}
                <div className="grid grid-cols-4 gap-1 mt-3 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">KCAL</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                      {item.calories}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">PROTEIN</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {item.protein}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">CARBS</span>
                    <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {item.carbs}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">FAT</span>
                    <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {item.totalFat}g
                    </span>
                  </div>
                </div>

                {/* Tags & efficiency */}
                <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-500">
                  <span>{item.servingSize}</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {pPerDollar}g P / $ CAD
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => onViewDetails(item)}
                  className="px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Nutrition</span>
                </button>

                <button
                  onClick={() => toggleCompare(item)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isComparing
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {isComparing ? 'Comparing' : 'Compare'}
                </button>

                <button
                  onClick={() => onAddItemToTray(item)}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Tray</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
