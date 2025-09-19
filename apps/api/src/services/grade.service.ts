/**
 * Service for grade calculations following business rules
 */
export class GradeService {
  /**
   * Rounds a grade using half-up rounding to 1 decimal place
   * Examples: 7.25 → 7.3, 7.24 → 7.2, 7.15 → 7.2
   */
  static roundGrade(grade: number): number {
    return Math.round(grade * 10) / 10;
  }

  /**
   * Calculates weighted average grade
   * @param grades Array of {grade: number, weight: number}
   * @returns Rounded final grade (0-10)
   */
  static calculateWeightedAverage(grades: { grade: number; weight: number }[]): number {
    if (grades.length === 0) return 0;

    const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = grades.reduce((sum, g) => sum + (g.grade * g.weight), 0);
    const average = weightedSum / totalWeight;

    return this.roundGrade(average);
  }

  /**
   * Validates that weights sum to 100%
   * @param weights Array of weight values
   * @returns {isValid: boolean, total: number, difference: number}
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

  /**
   * Validates grade range (0-10)
   */
  static validateGrade(grade: number): boolean {
    return grade >= 0 && grade <= 10;
  }

  /**
   * Formats grade for display in pt-BR (using comma as decimal separator)
   */
  static formatGradeForDisplay(grade: number): string {
    return grade.toFixed(1).replace('.', ',');
  }

  /**
   * Parses grade from pt-BR format (comma) to number
   */
  static parseGradeFromDisplay(gradeStr: string): number {
    const normalized = gradeStr.replace(',', '.');
    return parseFloat(normalized);
  }
}