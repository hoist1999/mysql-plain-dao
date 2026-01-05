import { DbUtil } from '../../core/database/DbUtil';
import { getDbConfigFromEnv } from '../../core/database/DbConfigLoader';
import { runMigrations } from '../../cli/migrations/core/MigrationRunner';
import { ensureMigrationsTable, getAppliedMigrations } from '../../cli/migrations/core/MigrationTable';
import { writeFile, mkdir, unlink, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

describe('migrate up', () => {
  const testMigrationsDir = join(__dirname, '../../../test-migrations-up');
  const originalLog = console.log;

  beforeAll(async () => {
    // Mock console.log to suppress output during tests
    console.log = jest.fn();
    
    // Initialize database
    DbUtil.initialize(getDbConfigFromEnv());
    await ensureMigrationsTable();
  });

  afterAll(async () => {
    // Restore original console.log
    console.log = originalLog;

    // Clean up test tables
    try {
      await DbUtil.executeAsync('DROP TABLE IF EXISTS test_users');
      await DbUtil.executeAsync('DROP TABLE IF EXISTS test_products');
      await DbUtil.executeAsync('DELETE FROM migrations');
    } catch (error) {
      // Ignore cleanup errors
    }
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
    // Clean up migrations table and test tables
    await DbUtil.executeAsync('DELETE FROM migrations');
    await DbUtil.executeAsync('DROP TABLE IF EXISTS test_users');
    await DbUtil.executeAsync('DROP TABLE IF EXISTS test_products');

    // Create test migrations directory
    if (!existsSync(testMigrationsDir)) {
      await mkdir(testMigrationsDir, { recursive: true });
    }

    // Clean up test files
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

  it('should execute pending migrations in order', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;
    const migration2 = `20250101_130000_add_email.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `ALTER TABLE test_users ADD COLUMN email VARCHAR(255);`
    );

    // Run migrations
    await runMigrations(testMigrationsDir);

    // Check that migrations were recorded
    const applied = await getAppliedMigrations();
    expect(applied.length).toBe(2);
    expect(applied.map(m => m.name)).toContain('20250101_120000_create_users');
    expect(applied.map(m => m.name)).toContain('20250101_130000_add_email');

    // Check that applied_at and duration_ms are set
    applied.forEach(m => {
      expect(m.applied_at).toBeInstanceOf(Date);
      expect(m.duration_ms).toBeGreaterThanOrEqual(0);
    });

    // Check that database changes were applied
    const [users] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_users');
    const columns = Array.isArray(users) ? users.map((c: any) => c.Field) : [];
    expect(columns).toContain('id');
    expect(columns).toContain('name');
    expect(columns).toContain('email');
  });

  it('should stop execution on migration failure and rollback', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;
    const migration2 = `20250101_130000_failing_migration.sql`;
    const migration3 = `20250101_140000_should_not_run.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `-- This will fail - invalid SQL
INVALID SQL STATEMENT;`
    );

    await writeFile(
      join(testMigrationsDir, migration3),
      `CREATE TABLE test_products (
  id INT PRIMARY KEY
);`
    );

    // Run migrations - should fail on second migration
    await expect(runMigrations(testMigrationsDir)).rejects.toThrow();

    // Check that only first migration was recorded
    const applied = await getAppliedMigrations();
    expect(applied.length).toBe(1);
    expect(applied[0].name).toBe('20250101_120000_create_users');

    // Check that third migration was not executed (table should not exist)
    const [tables] = await DbUtil.queryAsync(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_products'"
    );
    const tablesArray = Array.isArray(tables) ? tables : [];
    expect(tablesArray.length).toBe(0);
  });

  it('should support --to option to run migrations up to a specific one', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;
    const migration2 = `20250101_130000_add_email.sql`;
    const migration3 = `20250101_140000_add_index.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `ALTER TABLE test_users ADD COLUMN email VARCHAR(255);`
    );

    await writeFile(
      join(testMigrationsDir, migration3),
      `CREATE INDEX idx_email ON test_users(email);`
    );

    // Run migrations up to second one
    await runMigrations(testMigrationsDir, { to: '20250101_130000_add_email' });

    // Check that only first two migrations were recorded
    const applied = await getAppliedMigrations();
    expect(applied.length).toBe(2);
    expect(applied.map(m => m.name)).toContain('20250101_120000_create_users');
    expect(applied.map(m => m.name)).toContain('20250101_130000_add_email');
    expect(applied.map(m => m.name)).not.toContain('20250101_140000_add_index');
  });

  it('should support --dry-run option', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    // Run migrations in dry-run mode
    await runMigrations(testMigrationsDir, { dryRun: true });

    // Check that no migrations were recorded
    const applied = await getAppliedMigrations();
    expect(applied.length).toBe(0);

    // Check that table was not created
    const [tables] = await DbUtil.queryAsync(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'test_users'"
    );
    const tablesArray = Array.isArray(tables) ? tables : [];
    expect(tablesArray.length).toBe(0);
  });

  it('should skip already applied migrations', async () => {
    // Create test migration files
    const migration1 = `20250101_120000_create_users.sql`;
    const migration2 = `20250101_130000_add_email.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE IF NOT EXISTS test_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `ALTER TABLE test_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`
    );

    // Run migrations first time
    await runMigrations(testMigrationsDir);
    const applied1 = await getAppliedMigrations();
    expect(applied1.length).toBe(2);

    // Run migrations again - should skip already applied
    await runMigrations(testMigrationsDir);
    const applied2 = await getAppliedMigrations();
    expect(applied2.length).toBe(2); // Should still be 2, not 4
  });
});

