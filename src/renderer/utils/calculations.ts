import { MealEntry, FoodItem } from '../types';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const calculateMealTotals = (meals: MealEntry[]): NutritionTotals => {
  return meals.reduce(
    (totals, meal) => {
      meal.foods.forEach((food) => {
        totals.calories += food.calories;
        totals.protein += food.protein;
        totals.carbs += food.carbs;
        totals.fats += food.fats;
      });
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

export const calculateFoodTotals = (foods: FoodItem[]): NutritionTotals => {
  return foods.reduce(
    (totals, food) => ({
      calories: totals.calories + food.calories,
      protein: totals.protein + food.protein,
      carbs: totals.carbs + food.carbs,
      fats: totals.fats + food.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

export const calculateProgress = (current: number, goal: number): number => {
  if (goal === 0) return 0;
  return Math.min((current / goal) * 100, 100);
};

export const getProgressColor = (current: number, goal: number): string => {
  const percentage = (current / goal) * 100;
  if (percentage < 80) return 'bg-green-500';
  if (percentage < 100) return 'bg-yellow-500';
  return 'bg-red-500';
};
