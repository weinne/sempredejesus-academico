import { db } from '../db';
import { auditLogs, NewAuditLog } from '../db/schema';

export class AuditService {
  static async log(params: {
    userId: number;
    entityType: string;
    entityId: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    oldValues?: any;
    newValues?: any;
    metadata?: any;
  }) {
    try {
      await db.insert(auditLogs).values({
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }

  static async logGradeChange(params: {
    userId: number;
    alunoId: string;
    avaliacaoId: number;
    oldGrade?: number;
    newGrade: number;
    turmaId: number;
  }) {
    await AuditService.log({
      userId: params.userId,
      entityType: 'avaliacao_aluno',
      entityId: params.avaliacaoId,
      action: params.oldGrade !== undefined ? 'UPDATE' : 'CREATE',
      oldValues: params.oldGrade !== undefined ? { nota: params.oldGrade } : null,
      newValues: { nota: params.newGrade },
      metadata: {
        alunoId: params.alunoId,
        turmaId: params.turmaId,
        avaliacaoId: params.avaliacaoId,
      },
    });
  }

  static async logAttendanceChange(params: {
    userId: number;
    alunoId: string;
    aulaId: number;
    oldPresence?: boolean;
    newPresence: boolean;
    turmaId: number;
  }) {
    await AuditService.log({
      userId: params.userId,
      entityType: 'frequencia',
      entityId: params.aulaId,
      action: params.oldPresence !== undefined ? 'UPDATE' : 'CREATE',
      oldValues: params.oldPresence !== undefined ? { presente: params.oldPresence } : null,
      newValues: { presente: params.newPresence },
      metadata: {
        alunoId: params.alunoId,
        turmaId: params.turmaId,
        aulaId: params.aulaId,
      },
    });
  }
}