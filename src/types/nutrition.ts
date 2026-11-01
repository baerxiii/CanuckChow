export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'late-night';

export type CanadianChainId =
  | 'tim-hortons'
  | 'aw-canada'
  | 'harveys'
  | 'mary-browns'
  | 'swiss-chalet'
  | 'st-hubert'
  | 'smokes-poutinerie'
  | 'booster-juice'
  | 'beavertails'
  | 'freshii'
  | 'pizza-pizza'
  | 'boston-pizza'
  | 'pita-pit'
  | 'osmows'
  | 'mucho-burrito'
  | 'new-york-fries'
  | 'mcdonalds-ca'
  | 'wendys-ca'
  | 'subway-ca'
  | 'dairy-queen-ca'
  | 'popeyes-ca'
  | 'kfc-ca'
  | 'starbucks-ca'
  | 'custom';

export type FoodCategory =
  | 'burgers'
  | 'chicken'
  | 'breakfast'
  | 'bowls-salads'
  | 'pizza-pitas'
  | 'poutine-sides'
  | 'beverages'
  | 'desserts-baked';

export interface MenuItem {
  id: string;
  chainId: CanadianChainId;
  name: string;
  category: FoodCategory;
  servingSize: string;
  priceCAD: number;
  calories: number;
  protein: number; // grams
  totalFat: number; // grams
  saturatedFat: number; // grams
  transFat?: number; // grams
  carbs: number; // grams
  fiber: number; // grams
  sugars: number; // grams
  sodium: number; // mg
  isCanadianClassic?: boolean;
  tags?: string[]; // e.g. "High Protein", "Under 500 Cal", "Vegetarian", "Value Staple"
  description?: string;
  isCustom?: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  customPriceCAD?: number;
}

export interface LoggedMeal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: MealType;
  chainId: CanadianChainId | 'custom';
  chainName: string;
  items: OrderItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalSodium: number;
  totalCostCAD: number;
  notes?: string;
}

export interface FavoriteMeal {
  id: string;
  title: string;
  chainId: CanadianChainId;
  items: OrderItem[];
  totalCalories: number;
  totalProtein: number;
  totalCostCAD: number;
}

export interface UserGoals {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  sodiumLimit: number; // mg
  monthlyBudgetCAD: number;
  provinceCode: string;
  taxRate: number; // e.g. 0.13 for 13%
}

export interface CanadianChainMeta {
  id: CanadianChainId;
  name: string;
  origin: string;
  foundedYear: number;
  tagline: string;
  brandColor: string;
  textColor: string;
  badgeText: string;
  description: string;
}
