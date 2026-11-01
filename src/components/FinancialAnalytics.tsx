import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  Receipt,
  PieChart,
  Award,
  ChevronDown,
  Filter
} from 'lucide-react';
import { LoggedMeal, UserGoals } from '../types/nutrition';
import { CANADIAN_CHAINS, MENU_DATABASE } from '../data/canadianChains';
import { exportMealsToCSV, formatCAD } from '../utils/storage';

interface FinancialAnalyticsProps {
  loggedMeals: LoggedMeal[];
  userGoals: UserGoals;
  onOpenGoalsModal: () => void;
}

export const FinancialAnalytics: React.FC<FinancialAnalyticsProps> = ({
  loggedMeals,
  userGoals,
  onOpenGoalsModal
}) => {
  const [filterChain, setFilterChain] = useState<string>('all');

  // Compute spend stats
  const totalSpentAllTime = loggedMeals.reduce((acc, m) => acc + m.totalCostCAD, 0);

  // Current month calculation
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthMeals = loggedMeals.filter(m => m.date.startsWith(currentYearMonth));
  const currentMonthSpend = currentMonthMeals.reduce((acc, m) => acc + m.totalCostCAD, 0);
  const budgetPercent = Math.min(
    Math.round((currentMonthSpend / userGoals.monthlyBudgetCAD) * 100),
    100
  );
  const remainingBudget = userGoals.monthlyBudgetCAD - currentMonthSpend;

  // Average cost per order
  const avgCostPerOrder =
    loggedMeals.length > 0 ? (totalSpentAllTime / loggedMeals.length).toFixed(2) : '0.00';

  // Group spend by Canadian Chain
  const spendByChain: Record<string, { name: string; count: number; spend: number; protein: number }> = {};
  loggedMeals.forEach(meal => {
    const key = meal.chainId;
    if (!spendByChain[key]) {
      spendByChain[key] = {
        name: meal.chainName,
        count: 0,
        spend: 0,
        protein: 0
      };
    }
    spendByChain[key].count += 1;
    spendByChain[key].spend += meal.totalCostCAD;
    spendByChain[key].protein += meal.totalProtein;
  });

  const sortedChainSpend = Object.values(spendByChain).sort((a, b) => b.spend - a.spend);

  // Calculate Protein per Dollar for entire Canadian Database (Macro-Economic Value Ranking)
  const proteinPerDollarRankings = MENU_DATABASE
    .map(item => {
      const pPerDollar = item.priceCAD > 0 ? item.protein / item.priceCAD : 0;
      return {
        item,
        pPerDollar: +pPerDollar.toFixed(2)
      };
    })
    .sort((a, b) => b.pPerDollar - a.pPerDollar)
    .slice(0, 10);

  // Filtered orders for the receipt ledger
  const filteredMeals = loggedMeals.filter(m => {
    if (filterChain !== 'all' && m.chainId !== filterChain) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Budget Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs font-semibold uppercase text-neutral-500">
              Monthly Dining Budget
            </span>
            <button
              onClick={onOpenGoalsModal}
              className="text-[11px] text-red-600 hover:underline font-medium"
            >
              Adjust
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {formatCAD(currentMonthSpend)}
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              / {formatCAD(userGoals.monthlyBudgetCAD)}
            </span>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                budgetPercent > 90 ? 'bg-amber-600' : 'bg-red-600'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>

          <p className="text-xs text-neutral-500 mt-2 font-mono">
            {remainingBudget >= 0 ? (
              <>
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {formatCAD(remainingBudget)}
                </strong>{' '}
                budget remaining this month
              </>
            ) : (
              <span className="text-red-600 font-semibold">
                {formatCAD(Math.abs(remainingBudget))} over monthly budget
              </span>
            )}
          </p>
        </div>

        {/* Average Order Spend */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
            Average Cost Per Order
          </span>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            ${avgCostPerOrder} CAD
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Based on {loggedMeals.length} tracked Canadian fast food runs
          </p>
        </div>

        {/* All-Time Fast Food Spend & CSV Export */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-neutral-500 block mb-1">
              All-Time Tracked Fast Food
            </span>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {formatCAD(totalSpentAllTime)}
            </div>
          </div>

          <button
            onClick={() => exportMealsToCSV(loggedMeals)}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Financial Diary (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Spend Distribution by Chain + Macro Economic Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Canadian Chain */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Spending by Canadian Chain
              </h3>
              <p className="text-xs text-neutral-500">
                Where your fast food dining dollars go
              </p>
            </div>
          </div>

          {sortedChainSpend.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 italic text-center">
              No orders logged yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedChainSpend.map(c => {
                const percentOfTotal = Math.round((c.spend / (totalSpentAllTime || 1)) * 100);
                const avgProteinPerDollar = (c.protein / (c.spend || 1)).toFixed(1);

                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {c.name}{' '}
                        <span className="text-neutral-400 font-normal">
                          ({c.count} {c.count === 1 ? 'visit' : 'visits'})
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 font-mono text-[11px]">
                          {avgProteinPerDollar}g P / $
                        </span>
                        <span className="font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                          {formatCAD(c.spend)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-neutral-800 dark:bg-neutral-200 h-full"
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Best Protein-Per-Dollar Value Leaderboard */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Protein-Per-Dollar Value Champions
                </h3>
              </div>
              <p className="text-xs text-neutral-500">
                Most protein per Canadian dollar across all menus
              </p>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {proteinPerDollarRankings.map((rank, idx) => {
              const chain = CANADIAN_CHAINS.find(c => c.id === rank.item.chainId);
              return (
                <div key={rank.item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-mono font-bold text-neutral-400 text-xs">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 dark:text-white truncate">
                        {rank.item.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {chain?.name} · {rank.item.protein}g protein · {formatCAD(rank.item.priceCAD)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {rank.pPerDollar}g
                    </span>
                    <span className="text-[10px] text-neutral-400 block">per $1.00 CAD</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Itemized Order & Receipt Ledger */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Fast Food Order Ledger
            </h3>
            <p className="text-xs text-neutral-500">
              Detailed transaction records of all logged fast food orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Filter by Chain:</span>
            <select
              value={filterChain}
              onChange={e => setFilterChain(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
            >
              <option value="all">All Canadian Chains</option>
              {CANADIAN_CHAINS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMeals.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No order receipts found matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Chain & Items</th>
                  <th className="px-5 py-3 text-right">Calories</th>
                  <th className="px-5 py-3 text-right">Macros (P / C / F)</th>
                  <th className="px-5 py-3 text-right">Cost (CAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredMeals.map(meal => (
                  <tr key={meal.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-neutral-900 dark:text-white">
                        {meal.date}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {meal.time} · {meal.mealType}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {meal.chainName}
                      </div>
                      <div className="text-[11px] text-neutral-500 line-clamp-1">
                        {meal.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                      </div>
                      {meal.notes && (
                        <div className="text-[10px] text-neutral-400 italic mt-0.5">
                          "{meal.notes}"
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                      {meal.totalCalories} kcal
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-neutral-600 dark:text-neutral-400 tabular-nums">
                      <strong className="text-neutral-900 dark:text-white">{meal.totalProtein}g</strong> P /{' '}
                      {meal.totalCarbs}g C / {meal.totalFat}g F
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                      {formatCAD(meal.totalCostCAD)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
