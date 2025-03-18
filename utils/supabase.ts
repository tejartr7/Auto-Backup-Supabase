import { createClient } from '@supabase/supabase-js'

// Define table schemas for type safety
export interface TableSchemas {
  User: unknown;
  Payment: unknown;
  Recipe: unknown;
  Macros: unknown;
  MealPlan: unknown;
  CheckedIngredient: unknown;
  EmailLog: unknown;
  UserRecipe: unknown;
  Blog: unknown;
}

export const sourceClient = createClient<TableSchemas>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export const targetClient = createClient<TableSchemas>(
  process.env.NEXT_PUBLIC_TARGET_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_TARGET_SUPABASE_KEY!
)

// Define table backup order to handle foreign key constraints
export const TABLE_BACKUP_ORDER = [
  'User',
  'Recipe',
  'Macros',
  'UserRecipe',
  'MealPlan',
  'Payment',
  'CheckedIngredient',
  'EmailLog',
  'Blog'
]