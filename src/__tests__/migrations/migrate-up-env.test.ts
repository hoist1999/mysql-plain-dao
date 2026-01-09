import { DbUtil } from '../../core/database/DbUtil';
import { getDbConfigFromEnv } from '../../core/database/DbConfigLoader';
import { runMigrations } from '../../cli/migrations/core/MigrationRunner';
import { ensureMigrationsTable, getAppliedMigrations } from '../../cli/migrations/core/MigrationTable';
import { parseConnectionString } from '../../cli/migrations/utils/connectionParser';
import { writeFile, mkdir, unlink, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import dotenvFlow from 'dotenv-flow';

describe('migrate up with .env file configuration', () => {
  const testMigrationsDir = join(__dirname, '../../../test-migrations-env');
  const originalLog = console.log;
  const originalEnv = process.env;

  beforeAll(async () => {
    // Mock console.log to suppress output during tests
    console.log = jest.fn();
    
    // Load environment variables from .env files
    // This simulates what would happen when running the CLI command
    dotenvFlow.config({
      node_env: process.env.NODE_ENV || 'test-local'
    });
    
    // Initialize database using environment variables
    const dbConfig = getDbConfigFromEnv();
    DbUtil.initialize(dbConfig);
    await ensureMigrationsTable();
  });

  afterAll(async () => {
    // Restore original console.log
    console.log = originalLog;
    process.env = originalEnv;

    // Clean up test tables
    try {
      await DbUtil.executeAsync('DROP TABLE IF EXISTS test_env_users');
      await DbUtil.executeAsync('DROP TABLE IF EXISTS test_env_products');
      await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env%"');
      await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env2%"');
      await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env_no_conn%"');
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
    await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env%"');
    await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env2%"');
    await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env_no_conn%"');
    await DbUtil.executeAsync('DROP TABLE IF EXISTS test_env_users');
    await DbUtil.executeAsync('DROP TABLE IF EXISTS test_env_products');

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

  it('should execute migrations using database config from .env file', async () => {
    // Create test migration file
    const migration1 = `20250101_120000_env_create_users.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_env_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    // Get database config from environment (simulating what CLI would do)
    const dbConfig = getDbConfigFromEnv();

    // Run migrations with config from environment
    await runMigrations(testMigrationsDir, {
      dbConfig: dbConfig,
    });

    // Check that migration was recorded
    const applied = await getAppliedMigrations();
    expect(applied.length).toBeGreaterThanOrEqual(1);
    const envMigration = applied.find(m => m.name === '20250101_120000_env_create_users');
    expect(envMigration).toBeDefined();

    // Check that database changes were applied
    const [users] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_env_users');
    const columns = Array.isArray(users) ? users.map((c: any) => c.Field) : [];
    expect(columns).toContain('id');
    expect(columns).toContain('name');
  });

  it('should execute multiple migrations using config from .env file', async () => {
    // Clean up before test to ensure clean state
    await DbUtil.executeAsync('DELETE FROM migrations WHERE name LIKE "20250101_%env2%"');
    await DbUtil.executeAsync('DROP TABLE IF EXISTS test_env_users');

    // Create test migration files
    const migration1 = `20250101_120000_env2_create_users.sql`;
    const migration2 = `20250101_130000_env2_add_email.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE IF NOT EXISTS test_env_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    await writeFile(
      join(testMigrationsDir, migration2),
      `ALTER TABLE test_env_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`
    );

    // Get database config from environment
    const dbConfig = getDbConfigFromEnv();

    // Run migrations
    await runMigrations(testMigrationsDir, {
      dbConfig: dbConfig,
    });

    // Check that migrations were recorded
    const applied = await getAppliedMigrations();
    const envMigrations = applied.filter(m => m.name.includes('env2'));
    // Note: We check >= 2 because previous tests might have left migrations
    // The important thing is that both migrations are present
    expect(envMigrations.length).toBeGreaterThanOrEqual(2);
    expect(envMigrations.map(m => m.name)).toContain('20250101_120000_env2_create_users');
    expect(envMigrations.map(m => m.name)).toContain('20250101_130000_env2_add_email');

    // Check that database changes were applied
    const [users] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_env_users');
    const columns = Array.isArray(users) ? users.map((c: any) => c.Field) : [];
    expect(columns).toContain('id');
    expect(columns).toContain('name');
    expect(columns).toContain('email');
  });

  it('should support multiple SQL statements using config from .env file', async () => {
    // Create test migration file with multiple statements
    const migration1 = `20250101_120000_env_create_multiple_tables.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_env_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE test_env_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_env_users_name ON test_env_users(name);
CREATE INDEX idx_env_products_name ON test_env_products(name);`
    );

    // Get database config from environment
    const dbConfig = getDbConfigFromEnv();

    // Run migrations
    await runMigrations(testMigrationsDir, {
      dbConfig: dbConfig,
    });

    // Check that migration was recorded
    const applied = await getAppliedMigrations();
    const envMigration = applied.find(m => m.name === '20250101_120000_env_create_multiple_tables');
    expect(envMigration).toBeDefined();

    // Check that all tables were created
    const [usersColumns] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_env_users');
    const usersColumnsArray = Array.isArray(usersColumns) ? usersColumns.map((c: any) => c.Field) : [];
    expect(usersColumnsArray).toContain('id');
    expect(usersColumnsArray).toContain('name');

    const [productsColumns] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_env_products');
    const productsColumnsArray = Array.isArray(productsColumns) ? productsColumns.map((c: any) => c.Field) : [];
    expect(productsColumnsArray).toContain('id');
    expect(productsColumnsArray).toContain('name');
    expect(productsColumnsArray).toContain('price');

    // Check that indexes were created
    const [usersIndexes] = await DbUtil.queryAsync(
      "SHOW INDEXES FROM test_env_users WHERE Key_name = 'idx_env_users_name'"
    );
    expect(Array.isArray(usersIndexes) ? usersIndexes.length : 0).toBeGreaterThan(0);

    const [productsIndexes] = await DbUtil.queryAsync(
      "SHOW INDEXES FROM test_env_products WHERE Key_name = 'idx_env_products_name'"
    );
    expect(Array.isArray(productsIndexes) ? productsIndexes.length : 0).toBeGreaterThan(0);
  });

  it('should execute migrations using DAO_CONN connection string from .env file', async () => {
    // Create test migration file
    const migration1 = `20250101_120000_env_conn_string.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_env_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    // Get database config from environment and create connection string
    const dbConfig = getDbConfigFromEnv();
    const connectionString = `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

    // Parse connection string (simulating what CLI would do with DAO_CONN)
    const parsedConfig = parseConnectionString(connectionString);

    // Run migrations with config from connection string
    await runMigrations(testMigrationsDir, {
      dbConfig: parsedConfig,
    });

    // Check that migration was recorded
    const applied = await getAppliedMigrations();
    const envMigration = applied.find(m => m.name === '20250101_120000_env_conn_string');
    expect(envMigration).toBeDefined();

    // Check that database changes were applied
    const [users] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_env_users');
    const columns = Array.isArray(users) ? users.map((c: any) => c.Field) : [];
    expect(columns).toContain('id');
    expect(columns).toContain('name');
  });

  it('should execute migrations without -c option, using DB_HOST/DB_USER/DB_PASSWORD/DB_DATABASE from .env', async () => {
    // Create test migration file
    const migration1 = `20250101_120000_env_no_conn_option.sql`;

    await writeFile(
      join(testMigrationsDir, migration1),
      `CREATE TABLE test_env_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);`
    );

    // Get database config from environment (simulating what CLI would do when -c is not provided)
    // This should work without needing to provide -c option
    const dbConfig = getDbConfigFromEnv();

    // Run migrations with config from environment (no connection string needed)
    await runMigrations(testMigrationsDir, {
      dbConfig: dbConfig,
    });

    // Check that migration was recorded
    const applied = await getAppliedMigrations();
    const envMigration = applied.find(m => m.name === '20250101_120000_env_no_conn_option');
    expect(envMigration).toBeDefined();

    // Check that database changes were applied
    const [users] = await DbUtil.queryAsync('SHOW COLUMNS FROM test_env_users');
    const columns = Array.isArray(users) ? users.map((c: any) => c.Field) : [];
    expect(columns).toContain('id');
    expect(columns).toContain('name');
  });
});
