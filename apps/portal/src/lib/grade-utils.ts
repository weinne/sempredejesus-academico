/**
 * Grade utility functions for Brazilian format (comma separator)
 */

export class GradeUtils {
  /**
   * Rounds a grade using half-up rounding to 1 decimal place
   * Examples: 7.25 → 7.3, 7.24 → 7.2, 7.15 → 7.2
   */
  static roundGrade(grade: number): number {
    return Math.round(grade * 10) / 10;
  }

  /**
   * Formats grade for display in pt-BR (using comma as decimal separator)
   */
  static formatGradeForDisplay(grade: number | null): string {
    if (grade === null || grade === undefined) return '-';
    return grade.toFixed(1).replace('.', ',');
  }

  /**
   * Parses grade from pt-BR format (comma) to number
   */
  static parseGradeFromDisplay(gradeStr: string): number | null {
    if (!gradeStr || gradeStr.trim() === '' || gradeStr === '-') return null;
    const normalized = gradeStr.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Validates grade range (0-10)
   */
  static validateGrade(grade: number): boolean {
    return grade >= 0 && grade <= 10;
  }

  /**
   * Gets grade color class based on value
   */
  static getGradeColorClass(grade: number | null): string {
    if (grade === null || grade === undefined) return 'text-gray-400';
    if (grade >= 7) return 'text-green-600 font-semibold';
    if (grade >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Validates that weights sum to 100%
   */
  static validateWeights(weights: number[]): { isValid: boolean; total: number; difference: number } {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const difference = 100 - total;
    
    return {
      isValid: total === 100,
      total,
      difference
    };
  }
}