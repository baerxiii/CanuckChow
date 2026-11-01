import React from 'react';
import { Plus } from 'lucide-react';

export type ActiveTab = 'diary' | 'order-builder' | 'chains' | 'analytics' | 'optimizer';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewOrder: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  cartCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('diary')}
          className="flex items-center gap-2 text-left group shrink-0 focus:outline-none"
        >
          <span className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🍁
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              Canuck<span className="text-red-600">Macro</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Single line, 1-2 words) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => setActiveTab('diary')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 dark:hover:text-white pb-0.5 ${
              activeTab === 'diary'
                ? 'text-red-600 dark:text-red-500 font-semibold border-b-2 border-red-600'
                : ''
            }`}
          >
            Daily Diary
          </button>
          <button
            onClick={() => setActiveTab('order-builder')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 dark:hover:text-white pb-0.5 relative ${
              activeTab === 'order-builder'
                ? 'text-red-600 dark:text-red-500 font-semibold border-b-2 border-red-600'
                : ''
            }`}
          >
            Order Builder
            {cartCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[11px] font-mono font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('chains')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 dark:hover:text-white pb-0.5 ${
              activeTab === 'chains'
                ? 'text-red-600 dark:text-red-500 font-semibold border-b-2 border-red-600'
                : ''
            }`}
          >
            Canadian Chains
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 dark:hover:text-white pb-0.5 ${
              activeTab === 'analytics'
                ? 'text-red-600 dark:text-red-500 font-semibold border-b-2 border-red-600'
                : ''
            }`}
          >
            Cost & Budget
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 dark:hover:text-white pb-0.5 ${
              activeTab === 'optimizer'
                ? 'text-red-600 dark:text-red-500 font-semibold border-b-2 border-red-600'
                : ''
            }`}
          >
            Meal Optimizer
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Track Fast Food</span>
          </button>
        </div>
      </div>

      {/* Mobile nav tab strip */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-200 dark:border-neutral-800 px-2 py-2 overflow-x-auto text-xs font-medium text-neutral-600 dark:text-neutral-400">
        <button
          onClick={() => setActiveTab('diary')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'diary' ? 'text-red-600 font-semibold' : ''}`}
        >
          Diary
        </button>
        <button
          onClick={() => setActiveTab('order-builder')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'order-builder' ? 'text-red-600 font-semibold' : ''}`}
        >
          Builder {cartCount > 0 ? `(${cartCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('chains')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'chains' ? 'text-red-600 font-semibold' : ''}`}
        >
          Chains
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'analytics' ? 'text-red-600 font-semibold' : ''}`}
        >
          Costs
        </button>
        <button
          onClick={() => setActiveTab('optimizer')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'optimizer' ? 'text-red-600 font-semibold' : ''}`}
        >
          Optimizer
        </button>
      </div>
    </header>
  );
};
