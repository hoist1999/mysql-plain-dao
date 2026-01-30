import { SqlUtil } from '../core/sql/SqlUtil';

describe('SqlUtil', () => {
  describe('in', () => {
    it('should build IN clause for string array', () => {
      const sql = SqlUtil.in('status', ['active', 'pending']);
      expect(sql).toBe("`status` IN ('active','pending')");
    });

    it('should build IN clause for single string', () => {
      const sql = SqlUtil.in('type', 'normal');
      expect(sql).toBe("`type` IN ('normal')");
    });

    it('should build IN clause for number array', () => {
      const sql = SqlUtil.in('id', [1, 2, 3]);
      expect(sql).toBe('`id` IN (1,2,3)');
    });

    it('should build IN clause for single number', () => {
      const sql = SqlUtil.in('id', 1);
      expect(sql).toBe('`id` IN (1)');
    });
  });

  describe('limitPagination', () => {
    it('should build LIMIT clause from pagination params', () => {
      const sql = SqlUtil.limitPagination({ current: 2, pageSize: 10 });
      expect(sql).toBe(' LIMIT 10, 10');
    });

    it('should use default values when params are missing', () => {
      const sql = SqlUtil.limitPagination({} as any);
      expect(sql).toBe(' LIMIT 0, 10');
    });
  });
});

