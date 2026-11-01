/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, Header } from './components/Header';
import { DailyDiary } from './components/DailyDiary';
import { OrderBuilder } from './components/OrderBuilder';
import { ChainExplorer } from './components/ChainExplorer';
import { FinancialAnalytics } from './components/FinancialAnalytics';
import { ComboOptimizer } from './components/ComboOptimizer';
import { GoalsModal } from './components/GoalsModal';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { ImportFoodModal } from './components/ImportFoodModal';
import {
  CanadianChainId,
  FavoriteMeal,
  LoggedMeal,
  MealType,
  MenuItem,
  OrderItem,
  UserGoals
} from './types/nutrition';
import {
  DEFAULT_GOALS,
  getTodayDateString,
  loadCustomItems,
  loadFavoriteMeals,
  loadLoggedMeals,
  loadUserGoals,
  saveCustomItems,
  saveFavoriteMeals,
  saveLoggedMeals,
  saveUserGoals
} from './utils/storage';
import { CANADIAN_CHAINS, MENU_DATABASE } from './data/canadianChains';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('diary');
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>(() => loadLoggedMeals());
  const [userGoals, setUserGoals] = useState<UserGoals>(() => loadUserGoals());
  const [favorites, setFavorites] = useState<FavoriteMeal[]>(() => loadFavoriteMeals());
  const [customItems, setCustomItems] = useState<MenuItem[]>(() => loadCustomItems());
  
  // Combined active menu database (official Canadian chains + custom imported foods)
  const allItems = useMemo(() => {
    return [...MENU_DATABASE, ...customItems];
  }, [customItems]);

  // Order Tray state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<CanadianChainId>('tim-hortons');

  // Modals state
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<MenuItem | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    saveLoggedMeals(loggedMeals);
  }, [loggedMeals]);

  useEffect(() => {
    saveUserGoals(userGoals);
  }, [userGoals]);

  useEffect(() => {
    saveFavoriteMeals(favorites);
  }, [favorites]);

  useEffect(() => {
    saveCustomItems(customItems);
  }, [customItems]);

  // Add individual custom food item
  const handleAddCustomItem = (newItem: MenuItem) => {
    setCustomItems(prev => [newItem, ...prev]);
  };

  // Bulk import food items (via JSON)
  const handleBulkImport = (newItems: MenuItem[]) => {
    setCustomItems(prev => [...newItems, ...prev]);
  };

  // Log a new meal
  const handleLogMeal = (mealData: Omit<LoggedMeal, 'id'>) => {
    const newMeal: LoggedMeal = {
      ...mealData,
      id: `meal-${Date.now()}`
    };
    setLoggedMeals(prev => [newMeal, ...prev]);
  };

  // Delete a logged meal
  const handleDeleteMeal = (mealId: string) => {
    setLoggedMeals(prev => prev.filter(m => m.id !== mealId));
  };

  // Save an order as a reusable Favorite combo
  const handleSaveFavorite = (
    title: string,
    items: OrderItem[],
    chainId: CanadianChainId
  ) => {
    const totalCalories = items.reduce((acc, i) => acc + i.menuItem.calories * i.quantity, 0);
    const totalProtein = items.reduce((acc, i) => acc + i.menuItem.protein * i.quantity, 0);
    const totalCostCAD = items.reduce((acc, i) => acc + (i.customPriceCAD ?? i.menuItem.priceCAD) * i.quantity, 0);

    const newFav: FavoriteMeal = {
      id: `fav-${Date.now()}`,
      title,
      chainId,
      items: [...items],
      totalCalories,
      totalProtein,
      totalCostCAD: +(totalCostCAD * (1 + userGoals.taxRate)).toFixed(2)
    };

    setFavorites(prev => [newFav, ...prev]);
  };

  const handleDeleteFavorite = (favId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== favId));
  };

  // Quick 1-tap logging of a favorite combo directly into today's diary
  const handleQuickLogFavorite = (fav: FavoriteMeal, mealType: MealType) => {
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const chain = CANADIAN_CHAINS.find(c => c.id === fav.chainId);

    const totalCarbs = fav.items.reduce((acc, i) => acc + i.menuItem.carbs * i.quantity, 0);
    const totalFat = fav.items.reduce((acc, i) => acc + i.menuItem.totalFat * i.quantity, 0);
    const totalSodium = fav.items.reduce((acc, i) => acc + i.menuItem.sodium * i.quantity, 0);

    const newMeal: LoggedMeal = {
      id: `meal-${Date.now()}`,
      date: getTodayDateString(),
      time: timeStr,
      mealType,
      chainId: fav.chainId,
      chainName: chain?.name || 'Canadian Fast Food',
      items: [...fav.items],
      totalCalories: fav.totalCalories,
      totalProtein: fav.totalProtein,
      totalCarbs,
      totalFat,
      totalSodium,
      totalCostCAD: fav.totalCostCAD,
      notes: `Quick logged from saved combo "${fav.title}"`
    };

    setLoggedMeals(prev => [newMeal, ...prev]);
  };

  // Add individual item to current tray
  const handleAddItemToTray = (item: MenuItem) => {
    setSelectedChainId(item.chainId);
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

  // Add combo generated from ComboOptimizer into order tray
  const handleAddComboToOrder = (comboItems: MenuItem[]) => {
    if (comboItems.length > 0) {
      setSelectedChainId(comboItems[0].chainId);
    }
    const newOrderItems: OrderItem[] = comboItems.map(item => ({
      menuItem: item,
      quantity: 1
    }));
    setOrderItems(newOrderItems);
    setActiveTab('order-builder');
  };

  const cartTotalCount = orderItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-red-500 selection:text-white transition-colors">
      {/* Top Bar Contract Compliant Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => setActiveTab('order-builder')}
        cartCount={cartTotalCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'diary' && (
          <DailyDiary
            loggedMeals={loggedMeals}
            onDeleteMeal={handleDeleteMeal}
            onQuickLogFavorite={handleQuickLogFavorite}
            favorites={favorites}
            onDeleteFavorite={handleDeleteFavorite}
            userGoals={userGoals}
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
            onNavigateToBuilder={(chainId) => {
              if (chainId) setSelectedChainId(chainId as CanadianChainId);
              setActiveTab('order-builder');
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}

        {activeTab === 'order-builder' && (
          <OrderBuilder
            allItems={allItems}
            orderItems={orderItems}
            setOrderItems={setOrderItems}
            selectedChainId={selectedChainId}
            setSelectedChainId={setSelectedChainId}
            userGoals={userGoals}
            onLogMeal={handleLogMeal}
            onSaveFavorite={handleSaveFavorite}
            onViewDetails={(item) => setDetailModalItem(item)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}

        {activeTab === 'chains' && (
          <ChainExplorer
            allItems={allItems}
            onAddItemToTray={handleAddItemToTray}
            onViewDetails={(item) => setDetailModalItem(item)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <FinancialAnalytics
            loggedMeals={loggedMeals}
            userGoals={userGoals}
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
          />
        )}

        {activeTab === 'optimizer' && (
          <ComboOptimizer
            allItems={allItems}
            onAddComboToOrder={handleAddComboToOrder}
            onNavigateToBuilder={() => setActiveTab('order-builder')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-500 dark:text-neutral-400 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              CanuckMacro
            </span>
            <span>·</span>
            <span>Canadian Fast Food Nutrition & Expense Tracking</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{allItems.length} active items across Canada</span>
            <span>·</span>
            <span className="font-mono">CAD Currency</span>
          </div>
        </div>
      </footer>

      {/* Target Goals Configuration Modal */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        goals={userGoals}
        onSave={(newGoals) => setUserGoals(newGoals)}
      />

      {/* Nutrition Facts Label Modal */}
      <ItemDetailsModal
        item={detailModalItem}
        onClose={() => setDetailModalItem(null)}
        onAddToOrder={handleAddItemToTray}
      />

      {/* Food Database & Importer Modal */}
      <ImportFoodModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onAddCustomItem={handleAddCustomItem}
        onBulkImport={handleBulkImport}
        customItemsCount={customItems.length}
      />
    </div>
  );
}
