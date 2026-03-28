import { RecipeItem } from './types';

/**
 * Calculate required materials from a recipe based on dough weight.
 */
export function calculateRequiredMaterials(recipe: RecipeItem, doughWeightKg: number) {
  return recipe.composition.map((item) => ({
    material_id: item.material_id,
    amountGrams: item.amount * doughWeightKg,
  }));
}

/**
 * Estimate target output based on dough weight and unit.
 */
export function estimateTargetOutput(recipe: RecipeItem, doughWeightKg: number, unit: 'pcs' | 'toples' | 'mika'): number {
  switch (unit) {
    case 'pcs':
      return doughWeightKg * recipe.yield_per_kg_pcs;
    case 'toples':
      return doughWeightKg * recipe.yield_per_kg_toples;
    case 'mika':
      return doughWeightKg * recipe.yield_per_kg_mika;
    default:
      return 0;
  }
}

/**
 * Calculate daily bonus based on production weight.
 * Rule: Standard = 2kg/day. Bonus = (Total - 2kg) * Rp 10.000
 */
export function calculateProductionBonus(totalWeightKg: number): number {
  const standardLimit = 2;
  const bonusPerKg = 10000;
  
  if (totalWeightKg <= standardLimit) return 0;
  return (totalWeightKg - standardLimit) * bonusPerKg;
}

/**
 * Calculate total daily pay.
 * Gaji = Pokok + Bonus - Potongan
 */
export function calculateDailyPay(baseSalary: number, bonus: number, deductions: number = 0): number {
  return baseSalary + bonus - deductions;
}
