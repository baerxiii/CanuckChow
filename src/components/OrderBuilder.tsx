import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Bookmark,
  CheckCircle,
  Search,
  Filter,
  DollarSign,
  Flame,
  Info,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  CanadianChainId,
  FoodCategory,
  LoggedMeal,
  MealType,
  MenuItem,
  OrderItem,
  UserGoals
} from '../types/nutrition';
import {
  CANADIAN_CHAINS,
  CATEGORY_LABELS,
  MENU_DATABASE
} from '../data/canadianChains';
import { formatCAD, getTodayDateString } from '../utils/storage';
import { NutritionLabel } from './NutritionLabel';

interface OrderBuilderProps {
  allItems: MenuItem[];
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  selectedChainId: CanadianChainId;
  setSelectedChainId: (chainId: CanadianChainId) => void;
  userGoals: UserGoals;
  onLogMeal: (meal: Omit<LoggedMeal, 'id'>) => void;
  onSaveFavorite: (title: string, items: OrderItem[], chainId: CanadianChainId) => void;
  onViewDetails: (item: MenuItem) => void;
  onOpenImportModal: () => void;
}

export const OrderBuilder: React.FC<OrderBuilderProps> = ({
  allItems,
  orderItems,
  setOrderItems,
  selectedChainId,
  setSelectedChainId,
  userGoals,
  onLogMeal,
  onSaveFavorite,
  onViewDetails,
  onOpenImportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'high-protein' | 'under-500' | 'classics'>('all');

  // Meal logging options
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [mealDate, setMealDate] = useState(getTodayDateString());
  const [mealTime, setMealTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [favoriteTitle, setFavoriteTitle] = useState('');
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [showOrderNutritionLabel, setShowOrderNutritionLabel] = useState(false);
  const [logSuccessToast, setLogSuccessToast] = useState(false);

  const currentChain = CANADIAN_CHAINS.find(c => c.id === selectedChainId) || {
    id: 'custom' as CanadianChainId,
    name: "Custom / Local Takeout",
    origin: "Canada",
    foundedYear: 2026,
    tagline: "Your Custom Food Items",
    brandColor: "#525252",
    textColor: "#FFFFFF",
    badgeText: "User Added",
    description: "Custom and user-imported Canadian fast food and local takeout items."
  };

  // Filter items
  const chainMenuItems = allItems.filter(item => {
    if (item.chainId !== selectedChainId && !(selectedChainId === 'custom' && item.isCustom)) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (dietFilter === 'high-protein' && item.protein < 25) return false;
    if (dietFilter === 'under-500' && item.calories >= 500) return false;
    if (dietFilter === 'classics' && !item.isCanadianClassic) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  // Calculate order totals
  const totalCalories = orderItems.reduce((acc, curr) => acc + curr.menuItem.calories * curr.quantity, 0);
  const totalProtein = orderItems.reduce((acc, curr) => acc + curr.menuItem.protein * curr.quantity, 0);
  const totalCarbs = orderItems.reduce((acc, curr) => acc + curr.menuItem.carbs * curr.quantity, 0);
  const totalFat = orderItems.reduce((acc, curr) => acc + curr.menuItem.totalFat * curr.quantity, 0);
  const totalSodium = orderItems.reduce((acc, curr) => acc + curr.menuItem.sodium * curr.quantity, 0);
  const totalCostPreTax = orderItems.reduce((acc, curr) => {
    const price = curr.customPriceCAD ?? curr.menuItem.priceCAD;
    return acc + price * curr.quantity;
  }, 0);
  const taxAmount = totalCostPreTax * userGoals.taxRate;
  const totalCostAfterTax = totalCostPreTax + taxAmount;

  // Protein efficiency ($ / g of protein)
  const proteinPerDollar = totalCostPreTax > 0 ? (totalProtein / totalCostPreTax).toFixed(1) : '0';

  const addItemToOrder = (item: MenuItem) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setOrderItems(prev => {
      return prev
        .map(i => {
          if (i.menuItem.id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.menuItem.id !== itemId));
  };

  const handleLogOrder = () => {
    if (orderItems.length === 0) return;
    onLogMeal({
      date: mealDate,
      time: mealTime,
      mealType,
      chainId: selectedChainId,
      chainName: currentChain.name,
      items: [...orderItems],
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalSodium,
      totalCostCAD: +(totalCostAfterTax).toFixed(2),
      notes: orderNotes.trim() || undefined
    });

    setLogSuccessToast(true);
    setTimeout(() => setLogSuccessToast(false), 3000);
    // Reset order
    setOrderItems([]);
    setOrderNotes('');
  };

  const handleSaveAsFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!favoriteTitle.trim() || orderItems.length === 0) return;
    onSaveFavorite(favoriteTitle.trim(), [...orderItems], selectedChainId);
    setFavoriteTitle('');
    setIsSavingFav(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {logSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg shadow-lg text-sm font-medium animate-in fade-in">
          <CheckCircle className="w-5 h-5" />
          <span>Order successfully logged to your Daily Diary!</span>
        </div>
      )}

      {/* Top Banner / Chain Selector */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Canadian Quick Service Fast Food
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                {currentChain.origin} (est. {currentChain.foundedYear})
              </span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
              {currentChain.name}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {currentChain.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Import Food</span>
            </button>

            <span className="text-xs text-neutral-500 hidden sm:inline">Switch Chain:</span>
            <select
              value={selectedChainId}
              onChange={e => setSelectedChainId(e.target.value as CanadianChainId)}
              className="px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              <option value="custom">Custom / Local Spot Items</option>
              {CANADIAN_CHAINS.map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chain quick pills / tabs */}
        <div className="flex gap-1.5 overflow-x-auto pt-4 pb-1 scrollbar-none">
          {CANADIAN_CHAINS.map(chain => {
            const isSelected = chain.id === selectedChainId;
            return (
              <button
                key={chain.id}
                onClick={() => setSelectedChainId(chain.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {chain.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Menu Browser on Left (60%), Live Order Tray on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Menu catalog */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={`Search ${currentChain.name} menu (e.g. wrap, poutine, iced, double)...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Categories
              </button>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey as FoodCategory)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === catKey
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Diet Quick Filters */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <div className="flex gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setDietFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    dietFilter === 'all'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setDietFilter('high-protein')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    dietFilter === 'high-protein'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  High Protein (&ge;25g)
                </button>
                <button
                  onClick={() => setDietFilter('under-500')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    dietFilter === 'under-500'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Under 500 Cal
                </button>
                <button
                  onClick={() => setDietFilter('classics')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    dietFilter === 'classics'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  🍁 Canadian Classics
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2.5">
            {chainMenuItems.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
                <p className="text-sm text-neutral-500">
                  No items found matching your current search or filters.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setDietFilter('all');
                  }}
                  className="mt-3 text-xs font-semibold text-red-600 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              chainMenuItems.map(item => {
                const inOrder = orderItems.find(i => i.menuItem.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        {item.isCanadianClassic && (
                          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                            🍁 Canadian Icon
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}

                      {/* Nutrient specs */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                          {item.calories} kcal
                        </span>
                        <span aria-hidden="true" className="text-neutral-300">·</span>
                        <span className="font-mono tabular-nums">
                          <strong className="text-neutral-800 dark:text-neutral-200">{item.protein}g</strong> Protein
                        </span>
                        <span aria-hidden="true" className="text-neutral-300">·</span>
                        <span className="font-mono tabular-nums">{item.carbs}g C</span>
                        <span aria-hidden="true" className="text-neutral-300">·</span>
                        <span className="font-mono tabular-nums">{item.totalFat}g F</span>
                        <span aria-hidden="true" className="text-neutral-300">·</span>
                        <span className="font-mono tabular-nums text-neutral-500">{item.sodium}mg Na</span>
                      </div>
                    </div>

                    {/* Right side: Price + Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                        {formatCAD(item.priceCAD)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onViewDetails(item)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="View Canadian Nutrition Facts"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {inOrder ? (
                          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 rounded transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-mono tabular-nums">
                              {inOrder.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItemToOrder(item)}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Current Order Tray & Calculator */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Current Order Tray
                </h3>
                <p className="text-xs text-neutral-500">
                  {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'} selected from {currentChain.name}
                </p>
              </div>

              {orderItems.length > 0 && (
                <button
                  onClick={() => setOrderItems([])}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear tray
                </button>
              )}
            </div>

            {/* Order Items List */}
            {orderItems.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 space-y-2">
                <p className="text-xs">Your tray is empty.</p>
                <p className="text-[11px] text-neutral-500">
                  Select items from the menu on the left to track calories, macros, and Canadian costs in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-56 overflow-y-auto py-2">
                {orderItems.map(item => (
                  <div key={item.menuItem.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900 dark:text-white truncate">
                        {item.menuItem.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {item.menuItem.calories * item.quantity} kcal · {item.menuItem.protein * item.quantity}g P
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                        {formatCAD((item.customPriceCAD ?? item.menuItem.priceCAD) * item.quantity)}
                      </span>

                      <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded p-0.5">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.menuItem.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Nutrition Summary Box */}
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-lg">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-neutral-500">Calories</span>
                  <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                    {totalCalories}
                  </span>
                  <span className="block text-[9px] text-neutral-400 font-mono">
                    {Math.round((totalCalories / userGoals.calories) * 100)}% daily
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-neutral-500">Protein</span>
                  <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                    {totalProtein}g
                  </span>
                  <span className="block text-[9px] text-neutral-400 font-mono">
                    {Math.round((totalProtein / userGoals.protein) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-neutral-500">Carbs</span>
                  <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                    {totalCarbs}g
                  </span>
                  <span className="block text-[9px] text-neutral-400 font-mono">
                    {Math.round((totalCarbs / userGoals.carbs) * 100)}%
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-neutral-500">Fat</span>
                  <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                    {totalFat}g
                  </span>
                  <span className="block text-[9px] text-neutral-400 font-mono">
                    {Math.round((totalFat / userGoals.fat) * 100)}%
                  </span>
                </div>
              </div>

              {/* Sodium warning if high */}
              <div className="flex items-center justify-between text-xs px-1 text-neutral-600 dark:text-neutral-400">
                <span>Sodium:</span>
                <span className={`font-mono font-semibold tabular-nums ${totalSodium > 1500 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  {totalSodium} mg / 2,300 mg limit
                </span>
              </div>

              {/* Cost & Tax Calculation */}
              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums">{formatCAD(totalCostPreTax)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{userGoals.provinceCode} Tax ({(userGoals.taxRate * 100).toFixed(1)}%):</span>
                  <span className="font-mono tabular-nums">{formatCAD(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-white pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Total (CAD):</span>
                  <span className="font-mono tabular-nums text-red-600 dark:text-red-400">
                    {formatCAD(totalCostAfterTax)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500 pt-1">
                  <span>Value Metric:</span>
                  <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                    {proteinPerDollar}g protein / $ CAD
                  </span>
                </div>
              </div>

              {/* Order Logging Controls */}
              {orderItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                        Meal Time Slot
                      </label>
                      <select
                        value={mealType}
                        onChange={e => setMealType(e.target.value as MealType)}
                        className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                        <option value="late-night">Late Night</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={mealDate}
                        onChange={e => setMealDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Order notes (e.g. no mayo, road trip to cottage)..."
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />

                  {/* Primary Log Button */}
                  <button
                    onClick={handleLogOrder}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Log Order to Daily Diary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Secondary actions: Save as Favorite / View Nutrition facts */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => setShowOrderNutritionLabel(!showOrderNutritionLabel)}
                      className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline decoration-dotted"
                    >
                      {showOrderNutritionLabel ? 'Hide Nutrition Label' : 'View Full Nutrition Label'}
                    </button>

                    <button
                      onClick={() => setIsSavingFav(true)}
                      className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 hover:text-red-600 font-medium"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save as Combo</span>
                    </button>
                  </div>

                  {/* Save favorite combo form */}
                  {isSavingFav && (
                    <form onSubmit={handleSaveAsFavorite} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg space-y-2 mt-2">
                      <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                        Favorite Order Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. My Go-to Tim's Breakfast"
                        value={favoriteTitle}
                        onChange={e => setFavoriteTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md"
                        required
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsSavingFav(false)}
                          className="px-2 py-1 text-[11px] text-neutral-500 hover:text-neutral-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[11px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Order Nutrition Facts Modal / Accordion */}
                  {showOrderNutritionLabel && (
                    <div className="pt-2">
                      <NutritionLabel
                        title={`Custom Order (${currentChain.name})`}
                        servingSize="Entire Order"
                        calories={totalCalories}
                        protein={totalProtein}
                        carbs={totalCarbs}
                        fiber={orderItems.reduce((acc, i) => acc + i.menuItem.fiber * i.quantity, 0)}
                        sugars={orderItems.reduce((acc, i) => acc + i.menuItem.sugars * i.quantity, 0)}
                        fat={totalFat}
                        saturatedFat={orderItems.reduce((acc, i) => acc + (i.menuItem.saturatedFat || 0) * i.quantity, 0)}
                        sodium={totalSodium}
                        priceCAD={totalCostAfterTax}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
