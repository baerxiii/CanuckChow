import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  Utensils,
  BookmarkCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  FavoriteMeal,
  LoggedMeal,
  MealType,
  OrderItem,
  UserGoals
} from '../types/nutrition';
import { CANADIAN_CHAINS, MENU_DATABASE } from '../data/canadianChains';
import { formatCAD, getTodayDateString } from '../utils/storage';

interface DailyDiaryProps {
  loggedMeals: LoggedMeal[];
  onDeleteMeal: (mealId: string) => void;
  onQuickLogFavorite: (fav: FavoriteMeal, mealType: MealType) => void;
  favorites: FavoriteMeal[];
  onDeleteFavorite: (favId: string) => void;
  userGoals: UserGoals;
  onOpenGoalsModal: () => void;
  onNavigateToBuilder: (chainId?: string) => void;
  onOpenImportModal: () => void;
}

export const DailyDiary: React.FC<DailyDiaryProps> = ({
  loggedMeals,
  onDeleteMeal,
  onQuickLogFavorite,
  favorites,
  onDeleteFavorite,
  userGoals,
  onOpenGoalsModal,
  onNavigateToBuilder,
  onOpenImportModal,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [quickFavMealType, setQuickFavMealType] = useState<MealType>('lunch');

  // Change date by delta days
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const isToday = selectedDate === getTodayDateString();

  // Filter meals for the selected date
  const dayMeals = loggedMeals.filter(m => m.date === selectedDate);

  // Daily totals
  const totalCalories = dayMeals.reduce((acc, m) => acc + m.totalCalories, 0);
  const totalProtein = dayMeals.reduce((acc, m) => acc + m.totalProtein, 0);
  const totalCarbs = dayMeals.reduce((acc, m) => acc + m.totalCarbs, 0);
  const totalFat = dayMeals.reduce((acc, m) => acc + m.totalFat, 0);
  const totalSodium = dayMeals.reduce((acc, m) => acc + m.totalSodium, 0);
  const totalCost = dayMeals.reduce((acc, m) => acc + m.totalCostCAD, 0);

  // Remaining calories
  const remainingCalories = userGoals.calories - totalCalories;

  // Macro percentages
  const calPercent = Math.min(Math.round((totalCalories / userGoals.calories) * 100), 100);
  const proPercent = Math.min(Math.round((totalProtein / userGoals.protein) * 100), 100);
  const carbPercent = Math.min(Math.round((totalCarbs / userGoals.carbs) * 100), 100);
  const fatPercent = Math.min(Math.round((totalFat / userGoals.fat) * 100), 100);
  const sodiumPercent = Math.round((totalSodium / userGoals.sodiumLimit) * 100);

  const mealTypeSections: { type: MealType; label: string; timeHint: string }[] = [
    { type: 'breakfast', label: 'Breakfast', timeHint: '6:00 AM - 11:00 AM' },
    { type: 'lunch', label: 'Lunch', timeHint: '11:00 AM - 3:00 PM' },
    { type: 'dinner', label: 'Dinner', timeHint: '5:00 PM - 9:00 PM' },
    { type: 'snack', label: 'Snacks & Coffee Breaks', timeHint: 'Anytime' },
    { type: 'late-night', label: 'Late Night Run', timeHint: '10:00 PM - 4:00 AM' }
  ];

  return (
    <div className="space-y-6">
      {/* Date Navigation & Settings Strip */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-900 dark:text-white">
            <Calendar className="w-4 h-4 text-red-600" />
            <span>{selectedDate}</span>
            {isToday && (
              <span className="text-[11px] font-sans font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded">
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => handleDateShift(1)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="text-xs text-neutral-500 hover:text-red-600 underline ml-2"
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* Action: Configure Goals & Daily Spend badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-neutral-500 block uppercase font-semibold">
              Today's Fast Food Spend
            </span>
            <span className="text-base font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {formatCAD(totalCost)}
            </span>
          </div>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-red-600" />
            <span>Add / Import Food</span>
          </button>

          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-500" />
            <span>Edit Targets</span>
          </button>
        </div>
      </div>

      {/* Daily Nutrition & Calorie Dashboard */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Main Calorie Gauge */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-4 md:pb-0 md:pr-6">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs uppercase font-semibold text-neutral-500">
                Daily Calories
              </span>
              <span className="text-xs font-mono font-medium text-neutral-400">
                Target: {userGoals.calories}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-neutral-900 dark:text-white tabular-nums">
                {totalCalories}
              </span>
              <span className="text-xs text-neutral-500 font-mono">kcal</span>
            </div>

            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalCalories > userGoals.calories ? 'bg-amber-500' : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(100, calPercent)}%` }}
              />
            </div>

            <p className="text-xs text-neutral-500 mt-2 font-mono">
              {remainingCalories >= 0 ? (
                <>
                  <strong className="text-neutral-800 dark:text-neutral-200 tabular-nums">
                    {remainingCalories} kcal
                  </strong>{' '}
                  remaining today
                </>
              ) : (
                <span className="text-amber-600 font-semibold tabular-nums">
                  +{Math.abs(remainingCalories)} kcal over target
                </span>
              )}
            </p>
          </div>

          {/* Macro Breakdown */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Protein */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">Protein</span>
                <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
                  {totalProtein}g / {userGoals.protein}g
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: `${proPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
                {Math.round(((totalProtein * 4) / (totalCalories || 1)) * 100)}% of intake
              </span>
            </div>

            {/* Carbs */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">Carbohydrates</span>
                <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
                  {totalCarbs}g / {userGoals.carbs}g
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-full transition-all"
                  style={{ width: `${carbPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
                {Math.round(((totalCarbs * 4) / (totalCalories || 1)) * 100)}% of intake
              </span>
            </div>

            {/* Fat */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">Total Fat</span>
                <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
                  {totalFat}g / {userGoals.fat}g
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block font-mono">
                {Math.round(((totalFat * 9) / (totalCalories || 1)) * 100)}% of intake
              </span>
            </div>
          </div>
        </div>

        {/* Sodium Watch Bar */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">
              Health Canada Sodium Watch:
            </span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
              {totalSodium} mg
            </span>
            <span className="text-neutral-400 font-mono">
              ({sodiumPercent}% of {userGoals.sodiumLimit}mg limit)
            </span>
          </div>

          {totalSodium > userGoals.sodiumLimit && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Above recommended daily sodium limit</span>
            </div>
          )}
        </div>
      </div>

      {/* Saved Favorite Combos Quick-Logger */}
      {favorites.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                1-Tap Favorite Orders
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span>Log as:</span>
              <select
                value={quickFavMealType}
                onChange={e => setQuickFavMealType(e.target.value as MealType)}
                className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favorites.map(fav => {
              const chain = CANADIAN_CHAINS.find(c => c.id === fav.chainId);
              return (
                <div
                  key={fav.id}
                  className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-between gap-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {fav.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {fav.totalCalories} kcal · {fav.totalProtein}g P · {formatCAD(fav.totalCostCAD)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onQuickLogFavorite(fav, quickFavMealType)}
                      className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-2xs"
                      title="Log this combo right now to selected date"
                    >
                      + Log
                    </button>
                    <button
                      onClick={() => onDeleteFavorite(fav.id)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      title="Delete saved combo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meal Breakdown by Meal Time Slots */}
      <div className="space-y-4">
        {mealTypeSections.map(section => {
          const mealsInSection = dayMeals.filter(m => m.mealType === section.type);
          const sectionCals = mealsInSection.reduce((acc, m) => acc + m.totalCalories, 0);
          const sectionProtein = mealsInSection.reduce((acc, m) => acc + m.totalProtein, 0);
          const sectionCost = mealsInSection.reduce((acc, m) => acc + m.totalCostCAD, 0);

          return (
            <div
              key={section.type}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs"
            >
              {/* Section Header */}
              <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {section.label}
                  </h3>
                  <span className="text-[11px] text-neutral-400">{section.timeHint}</span>
                </div>

                <div className="flex items-center gap-4">
                  {mealsInSection.length > 0 && (
                    <div className="text-right text-xs">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                        {sectionCals} kcal
                      </span>
                      <span className="text-neutral-400 mx-1">·</span>
                      <span className="font-mono text-neutral-600 dark:text-neutral-400 tabular-nums">
                        {sectionProtein}g P
                      </span>
                      <span className="text-neutral-400 mx-1">·</span>
                      <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                        {formatCAD(sectionCost)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onNavigateToBuilder()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Track Food</span>
                  </button>
                </div>
              </div>

              {/* Meals in this slot */}
              {mealsInSection.length === 0 ? (
                <div className="px-5 py-4 text-xs text-neutral-400 italic">
                  No food logged for {section.label.toLowerCase()} yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {mealsInSection.map(meal => {
                    const chainMeta = CANADIAN_CHAINS.find(c => c.id === meal.chainId);
                    return (
                      <div key={meal.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white">
                              {meal.chainName}
                            </span>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              at {meal.time}
                            </span>
                          </div>

                          {/* Items listed */}
                          <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 space-y-0.5">
                            {meal.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                                  {item.quantity}x
                                </span>
                                <span>{item.menuItem.name}</span>
                                <span className="text-neutral-400 font-mono text-[11px]">
                                  ({item.menuItem.calories * item.quantity} cal, {item.menuItem.protein * item.quantity}g P)
                                </span>
                              </div>
                            ))}
                          </div>

                          {meal.notes && (
                            <p className="text-[11px] text-neutral-500 italic mt-1.5">
                              "{meal.notes}"
                            </p>
                          )}
                        </div>

                        {/* Nutrition & Cost totals */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 dark:border-neutral-800">
                          <div className="text-right text-xs">
                            <div className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                              {meal.totalCalories} kcal
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                              {meal.totalProtein}g P · {meal.totalCarbs}g C · {meal.totalFat}g F
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                              {meal.totalSodium}mg Na
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                              {formatCAD(meal.totalCostCAD)}
                            </div>
                            <button
                              onClick={() => onDeleteMeal(meal.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 transition-colors mt-1"
                              title="Delete meal record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
