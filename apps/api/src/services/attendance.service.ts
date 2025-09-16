/**
 * Service for attendance calculations and alerts
 */
export class AttendanceService {
  /**
   * Calculates attendance percentage
   * @param totalClasses Total number of classes in the period
   * @param absences Number of absences
   * @returns Attendance percentage (0-100)
   */
  static calculateAttendancePercentage(totalClasses: number, absences: number): number {
    if (totalClasses === 0) return 100;
    const attendedClasses = totalClasses - absences;
    return Math.round((attendedClasses / totalClasses) * 10000) / 100; // 2 decimal places
  }

  /**
   * Calculates absence percentage 
   * @param totalClasses Total number of classes in the period
   * @param absences Number of absences
   * @returns Absence percentage (0-100)
   */
  static calculateAbsencePercentage(totalClasses: number, absences: number): number {
    if (totalClasses === 0) return 0;
    return Math.round((absences / totalClasses) * 10000) / 100; // 2 decimal places
  }

  /**
   * Determines attendance alert level
   * @param totalClasses Total number of classes
   * @param absences Number of absences
   * @returns Alert level: 'normal' | 'warning' | 'critical'
   */
  static getAttendanceAlertLevel(totalClasses: number, absences: number): 'normal' | 'warning' | 'critical' {
    const absencePercentage = this.calculateAbsencePercentage(totalClasses, absences);
    
    if (absencePercentage >= 25) {
      return 'critical'; // ≥ 25% absences
    } else if (absencePercentage >= 20) {
      return 'warning'; // ≥ 20% and < 25% absences  
    } else {
      return 'normal'; // < 20% absences
    }
  }

  /**
   * Gets alert message for the attendance level
   */
  static getAttendanceAlertMessage(level: 'normal' | 'warning' | 'critical', absencePercentage: number): string | null {
    switch (level) {
      case 'critical':
        return `ATENÇÃO: Aluno excedeu 25% de faltas (${absencePercentage.toFixed(1)}%). Risco de reprovação por frequência.`;
      case 'warning':
        return `AVISO: Aluno se aproxima do limite de faltas (${absencePercentage.toFixed(1)}%). Limite máximo: 25%.`;
      case 'normal':
        return null;
      default:
        return null;
    }
  }

  /**
   * Checks if student needs attendance alert
   */
  static needsAttendanceAlert(totalClasses: number, absences: number): boolean {
    const level = this.getAttendanceAlertLevel(totalClasses, absences);
    return level === 'warning' || level === 'critical';
  }

  /**
   * Gets attendance status for display
   */
  static getAttendanceStatus(totalClasses: number, absences: number) {
    const attendancePercentage = this.calculateAttendancePercentage(totalClasses, absences);
    const absencePercentage = this.calculateAbsencePercentage(totalClasses, absences);
    const alertLevel = this.getAttendanceAlertLevel(totalClasses, absences);
    const alertMessage = this.getAttendanceAlertMessage(alertLevel, absencePercentage);

    return {
      totalClasses,
      absences,
      attendedClasses: totalClasses - absences,
      attendancePercentage,
      absencePercentage,
      alertLevel,
      alertMessage,
      needsAlert: this.needsAttendanceAlert(totalClasses, absences)
    };
  }
}