import { FavoriteMeal, LoggedMeal, MenuItem, UserGoals } from '../types/nutrition';
import { MENU_DATABASE } from '../data/canadianChains';

const STORAGE_KEYS = {
  GOALS: 'canuckmacro_user_goals_v1',
  LOGGED_MEALS: 'canuckmacro_logged_meals_v1',
  FAVORITES: 'canuckmacro_favorite_meals_v1',
  CUSTOM_ITEMS: 'canuckmacro_custom_items_v1',
};

export const DEFAULT_GOALS: UserGoals = {
  calories: 2200,
  protein: 140, // grams
  carbs: 220, // grams
  fat: 70, // grams
  sodiumLimit: 2300, // mg (Health Canada recommended upper daily limit)
  monthlyBudgetCAD: 220.00,
  provinceCode: 'ON',
  taxRate: 0.13 // 13% HST Ontario default
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Generate realistic starter data for the current week so charts, budget, and daily logs show real Canadian habits immediately
export function getInitialLoggedMeals(): LoggedMeal[] {
  const today = getTodayDateString();
  const d = new Date();
  
  const yesterday = new Date(d);
  yesterday.setDate(d.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const twoDaysAgo = new Date(d);
  twoDaysAgo.setDate(d.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  const timMuffin = MENU_DATABASE.find(i => i.id === 'tim-english-muffin-bacon-egg')!;
  const timDoubleDouble = MENU_DATABASE.find(i => i.id === 'tim-double-double-med')!;
  const awTeen = MENU_DATABASE.find(i => i.id === 'aw-teen-burger')!;
  const awRings = MENU_DATABASE.find(i => i.id === 'aw-onion-rings')!;
  const awRootBeer = MENU_DATABASE.find(i => i.id === 'aw-root-beer-regular')!;
  const osmowRocks = MENU_DATABASE.find(i => i.id === 'osmows-chicken-on-the-rocks-med')!;
  const mcdJrChicken = MENU_DATABASE.find(i => i.id === 'mcd-jr-chicken')!;
  const mcdDouble = MENU_DATABASE.find(i => i.id === 'mcd-mcdouble')!;

  return [
    {
      id: 'meal-seed-1',
      date: today,
      time: '08:45',
      mealType: 'breakfast',
      chainId: 'tim-hortons',
      chainName: 'Tim Hortons',
      items: [
        { menuItem: timMuffin, quantity: 1 },
        { menuItem: timDoubleDouble, quantity: 1 }
      ],
      totalCalories: timMuffin.calories + timDoubleDouble.calories,
      totalProtein: timMuffin.protein + timDoubleDouble.protein,
      totalCarbs: timMuffin.carbs + timDoubleDouble.carbs,
      totalFat: timMuffin.totalFat + timDoubleDouble.totalFat,
      totalSodium: timMuffin.sodium + timDoubleDouble.sodium,
      totalCostCAD: +(timMuffin.priceCAD + timDoubleDouble.priceCAD).toFixed(2),
      notes: 'Morning drive-thru run before work'
    },
    {
      id: 'meal-seed-2',
      date: today,
      time: '12:30',
      mealType: 'lunch',
      chainId: 'aw-canada',
      chainName: 'A&W Canada',
      items: [
        { menuItem: awTeen, quantity: 1 },
        { menuItem: awRings, quantity: 1 },
        { menuItem: awRootBeer, quantity: 1 }
      ],
      totalCalories: awTeen.calories + awRings.calories + awRootBeer.calories,
      totalProtein: awTeen.protein + awRings.protein + awRootBeer.protein,
      totalCarbs: awTeen.carbs + awRings.carbs + awRootBeer.carbs,
      totalFat: awTeen.totalFat + awRings.totalFat + awRootBeer.totalFat,
      totalSodium: awTeen.sodium + awRings.sodium + awRootBeer.sodium,
      totalCostCAD: +(awTeen.priceCAD + awRings.priceCAD + awRootBeer.priceCAD).toFixed(2),
      notes: 'Teen burger combo lunch'
    },
    {
      id: 'meal-seed-3',
      date: yesterdayStr,
      time: '18:15',
      mealType: 'dinner',
      chainId: 'osmows',
      chainName: "Osmow's Shawarma",
      items: [
        { menuItem: osmowRocks, quantity: 1 }
      ],
      totalCalories: osmowRocks.calories,
      totalProtein: osmowRocks.protein,
      totalCarbs: osmowRocks.carbs,
      totalFat: osmowRocks.totalFat,
      totalSodium: osmowRocks.sodium,
      totalCostCAD: osmowRocks.priceCAD,
      notes: 'Post-workout dinner, loaded with 52g protein'
    },
    {
      id: 'meal-seed-4',
      date: twoDaysAgoStr,
      time: '13:10',
      mealType: 'lunch',
      chainId: 'mcdonalds-ca',
      chainName: "McDonald's Canada",
      items: [
        { menuItem: mcdDouble, quantity: 1 },
        { menuItem: mcdJrChicken, quantity: 1 }
      ],
      totalCalories: mcdDouble.calories + mcdJrChicken.calories,
      totalProtein: mcdDouble.protein + mcdJrChicken.protein,
      totalCarbs: mcdDouble.carbs + mcdJrChicken.carbs,
      totalFat: mcdDouble.totalFat + mcdJrChicken.totalFat,
      totalSodium: mcdDouble.sodium + mcdJrChicken.sodium,
      totalCostCAD: +(mcdDouble.priceCAD + mcdJrChicken.priceCAD).toFixed(2),
      notes: 'Classic Canadian McGangBang budget combo'
    }
  ];
}

export function loadUserGoals(): UserGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user goals', e);
  }
  return DEFAULT_GOALS;
}

export function saveUserGoals(goals: UserGoals): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save user goals', e);
  }
}

export function loadLoggedMeals(): LoggedMeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGGED_MEALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load logged meals', e);
  }
  const initial = getInitialLoggedMeals();
  saveLoggedMeals(initial);
  return initial;
}

export function saveLoggedMeals(meals: LoggedMeal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGGED_MEALS, JSON.stringify(meals));
  } catch (e) {
    console.error('Failed to save logged meals', e);
  }
}

export function loadFavoriteMeals(): FavoriteMeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load favorites', e);
  }
  // Default Canadian favorites
  const timWrap = MENU_DATABASE.find(i => i.id === 'tim-farmers-wrap-bacon')!;
  const timIced = MENU_DATABASE.find(i => i.id === 'tim-iced-capp-med-milk')!;
  return [
    {
      id: 'fav-1',
      title: "Tim's Morning Routine",
      chainId: 'tim-hortons',
      items: [
        { menuItem: timWrap, quantity: 1 },
        { menuItem: timIced, quantity: 1 }
      ],
      totalCalories: timWrap.calories + timIced.calories,
      totalProtein: timWrap.protein + timIced.protein,
      totalCostCAD: +(timWrap.priceCAD + timIced.priceCAD).toFixed(2)
    }
  ];
}

export function saveFavoriteMeals(favorites: FavoriteMeal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

export function loadCustomItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ITEMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom items', e);
  }
  return [];
}

export function saveCustomItems(items: MenuItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save custom items', e);
  }
}

export function exportMealsToCSV(meals: LoggedMeal[]): void {
  const headers = [
    'Date',
    'Time',
    'Meal Type',
    'Canadian Chain',
    'Items Ordered',
    'Calories (kcal)',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
    'Sodium (mg)',
    'Cost ($ CAD)',
    'Notes'
  ];

  const rows = meals.map(meal => {
    const itemsStr = meal.items
      .map(i => `${i.quantity}x ${i.menuItem.name}`)
      .join(' + ')
      .replace(/"/g, '""');

    return [
      `"${meal.date}"`,
      `"${meal.time}"`,
      `"${meal.mealType}"`,
      `"${meal.chainName}"`,
      `"${itemsStr}"`,
      meal.totalCalories,
      meal.totalProtein,
      meal.totalCarbs,
      meal.totalFat,
      meal.totalSodium,
      meal.totalCostCAD.toFixed(2),
      `"${(meal.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `CanuckMacro_Diary_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
