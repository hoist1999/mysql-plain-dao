import { DbUtil } from '../../core/database/DbUtil';
import { getDbConfigFromEnv } from '../../core/database/DbConfigLoader';
import { getMigrationStatus } from '../../cli/migrations/core/MigrationRunner';
import { ensureMigrationsTable, recordMigrationApplied } from '../../cli/migrations/core/MigrationTable';
import { writeFile, mkdir, unlink, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('migrate status', () => {
  const testMigrationsDir = join(__dirname, '../../../test-migrations-status');

  beforeAll(async () => {
    // Initialize database
    DbUtil.initialize(getDbConfigFromEnv());
    await ensureMigrationsTable();

    // Create test migrations directory
    if (!existsSync(testMigrationsDir)) {
      await mkdir(testMigrationsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up migrations table
    await DbUtil.executeAsync('DELETE FROM migrations');
    await DbUtil.endPoolAsync();

    // Clean up test directory
    try {
      const files = await readdir(testMigrationsDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          await unlink(join(testMigrationsDir, file));
        }
      }
      await rm(testMigrationsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clean up migrations table and test files
    await DbUtil.executeAsync('DELETE FROM migrations');
    
    try {
      const files = await readdir(testMigrationsDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          await unlink(join(testMigrationsDir, file));
        }
      }
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  it('should show all migrations as pending when none are applied', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;
    const migration2 = `20250101_130000_add_email.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE IF NOT EXISTS test_users (id INT PRIMARY KEY);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `ALTER TABLE test_users ADD COLUMN email VARCHAR(255);`
    );

    const status = await getMigrationStatus(testMigrationsDir);

    expect(status.files.length).toBe(2);
    expect(status.applied.size).toBe(0);
    expect(status.pending.length).toBe(2);
    expect(status.pending.map(f => f.name)).toContain('20250101_120000_create_users');
    expect(status.pending.map(f => f.name)).toContain('20250101_130000_add_email');
  });

  it('should correctly identify applied and pending migrations', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;
    const migration2 = `20250101_130000_add_email.sql`;
    const migration3 = `20250101_140000_add_index.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE IF NOT EXISTS test_users (id INT PRIMARY KEY);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `ALTER TABLE test_users ADD COLUMN email VARCHAR(255);`
    );

    await writeFile(
      join(testMigrationsDir, migration3),
      `CREATE INDEX idx_email ON test_users(email);`
    );

    // Mark first two as applied
    await recordMigrationApplied('20250101_120000_create_users', new Date(), 10);
    await recordMigrationApplied('20250101_130000_add_email', new Date(), 15);

    const status = await getMigrationStatus(testMigrationsDir);

    expect(status.files.length).toBe(3);
    expect(status.applied.size).toBe(2);
    expect(status.applied.has('20250101_120000_create_users')).toBe(true);
    expect(status.applied.has('20250101_130000_add_email')).toBe(true);
    expect(status.pending.length).toBe(1);
    expect(status.pending[0].name).toBe('20250101_140000_add_index');
  });

  it('should handle empty migrations directory', async () => {
    const status = await getMigrationStatus(testMigrationsDir);

    expect(status.files.length).toBe(0);
    expect(status.applied.size).toBe(0);
    expect(status.pending.length).toBe(0);
  });
});

