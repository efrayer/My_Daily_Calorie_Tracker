import { z } from 'zod';

// Food Item Schema
const FoodItemSchema = z.object({
  name: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fats: z.number().min(0),
  servingSize: z.string().optional(),
});

// Meal Entry Schema
const MealEntrySchema = z.object({
  id: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  foods: z.array(FoodItemSchema),
  notes: z.string().optional(),
});

// Exercise Entry Schema
const ExerciseEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['2G', '3G', 'Tread 50', 'Weight 50', 'Other']),
  caloriesBurned: z.number().min(0),
  duration: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Water Schema
const WaterSchema = z.object({
  glasses: z.number().min(0).max(50),
  ounces: z.number().min(0).max(400),
});

// Daily Entry Schema
export const DailyEntrySchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(MealEntrySchema),
  water: WaterSchema,
  exercise: ExerciseEntrySchema.optional(),
  weight: z.number().min(0).max(1000).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
});

// Saved Food Schema
const SavedFoodSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fats: z.number().min(0),
  servingSize: z.string().optional(),
  category: z.string().optional(),
  useCount: z.number().min(0),
});

// User Goals Schema
const UserGoalsSchema = z.object({
  dailyCalories: z.number().min(500).max(10000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fats: z.number().min(0).max(500),
  waterGlasses: z.number().min(0).max(50),
  targetWeight: z.number().min(0).max(1000).optional(),
});

// Weight Entry Schema
const WeightEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().min(0).max(1000),
  notes: z.string().optional(),
});

// App Data Schema
export const AppDataSchema = z.object({
  savedFoods: z.array(SavedFoodSchema),
  recentMeals: z.array(MealEntrySchema),
  goals: UserGoalsSchema,
  weightHistory: z.array(WeightEntrySchema),
});

// Validation helper function
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return { success: false, error: `Validation failed: ${issues}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
