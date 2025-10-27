import { describe, it, expect } from 'vitest';

describe('Aulas Batch Logic', () => {
  describe('Date generation', () => {
    it('should generate correct dates for a weekly recurrence', () => {
      const startDate = new Date('2025-01-06'); // Monday
      const endDate = new Date('2025-01-27'); // Monday 3 weeks later
      const diaDaSemana = 1; // Monday = 1

      const generatedDates: string[] = [];
      const currentDate = new Date(startDate);

      // Find first occurrence of the target day
      while (currentDate.getDay() !== diaDaSemana && currentDate <= endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate all dates for the day of week
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        generatedDates.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 7); // Next week
      }

      expect(generatedDates).toHaveLength(4);
      expect(generatedDates[0]).toBe('2025-01-06');
      expect(generatedDates[3]).toBe('2025-01-27');
    });

    it('should handle Wednesday recurrence correctly', () => {
      const startDate = new Date('2025-01-01'); // Wednesday
      const endDate = new Date('2025-01-31');
      const diaDaSemana = 3; // Wednesday = 3

      const generatedDates: string[] = [];
      const currentDate = new Date(startDate);

      while (currentDate.getDay() !== diaDaSemana && currentDate <= endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        generatedDates.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 7);
      }

      expect(generatedDates).toHaveLength(5);
      expect(generatedDates.every(dateStr => new Date(dateStr).getDay() === 3)).toBe(true);
    });
  });

  describe('Holiday filtering', () => {
    it('should filter out dates that match calendar events', () => {
      const generatedDates = ['2025-01-06', '2025-01-13', '2025-01-20', '2025-01-27'];
      const holidays = [
        { inicio: '2025-01-13', termino: '2025-01-13' }, // Single day
      ];

      const holidayDates = new Set<string>();
      holidays.forEach(holiday => {
        const holidayStart = new Date(holiday.inicio);
        const holidayEnd = new Date(holiday.termino);
        
        generatedDates.forEach(dateStr => {
          const date = new Date(dateStr);
          if (date >= holidayStart && date <= holidayEnd) {
            holidayDates.add(dateStr);
          }
        });
      });

      const filtered = generatedDates.filter(dateStr => !holidayDates.has(dateStr));

      expect(filtered).toHaveLength(3);
      expect(filtered).not.toContain('2025-01-13');
    });

    it('should filter out multi-day holiday ranges', () => {
      const generatedDates = ['2025-01-06', '2025-01-13', '2025-01-20', '2025-01-27'];
      const holidays = [
        { inicio: '2025-01-12', termino: '2025-01-21' }, // Range spanning 2 dates
      ];

      const holidayDates = new Set<string>();
      holidays.forEach(holiday => {
        const holidayStart = new Date(holiday.inicio);
        const holidayEnd = new Date(holiday.termino);
        
        generatedDates.forEach(dateStr => {
          const date = new Date(dateStr);
          if (date >= holidayStart && date <= holidayEnd) {
            holidayDates.add(dateStr);
          }
        });
      });

      const filtered = generatedDates.filter(dateStr => !holidayDates.has(dateStr));

      expect(filtered).toHaveLength(2);
      expect(filtered).toContain('2025-01-06');
      expect(filtered).toContain('2025-01-27');
    });
  });

  describe('Conflict detection', () => {
    it('should identify existing aulas that conflict', () => {
      const newDates = ['2025-01-06', '2025-01-13', '2025-01-20', '2025-01-27'];
      const existingAulas = [
        { data: '2025-01-13' },
        { data: '2025-01-27' },
      ];

      const existingDates = new Set(existingAulas.map(a => a.data));
      const nonConflicting = newDates.filter(dateStr => !existingDates.has(dateStr));

      expect(nonConflicting).toHaveLength(2);
      expect(nonConflicting).toEqual(['2025-01-06', '2025-01-20']);
    });
  });
});

describe('Frequencia Bulk Upsert Logic', () => {
  it('should group frequencias by aula', () => {
    const itens = [
      { aulaId: 1, inscricaoId: 10, presente: true },
      { aulaId: 1, inscricaoId: 11, presente: false },
      { aulaId: 2, inscricaoId: 10, presente: true },
    ];

    const grouped = itens.reduce((acc, item) => {
      if (!acc[item.aulaId]) acc[item.aulaId] = [];
      acc[item.aulaId].push(item);
      return acc;
    }, {} as Record<number, typeof itens>);

    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(1);
  });

  it('should calculate attendance correctly', () => {
    const totalAulas = 10;
    const ausencias = 2;
    const attendancePercentage = ((totalAulas - ausencias) / totalAulas) * 100;

    expect(attendancePercentage).toBe(80);
  });
});

