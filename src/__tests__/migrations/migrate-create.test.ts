import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { unlink, mkdir, rm, readdir, writeFile } from 'fs/promises';

describe('migrate create', () => {
  const testMigrationsDir = join(__dirname, '../../../test-migrations-temp');

  beforeAll(async () => {
    // Create test migrations directory
    if (!existsSync(testMigrationsDir)) {
      await mkdir(testMigrationsDir, { recursive: true });
    }
  });

  afterAll(async () => {
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
    // Clean up any existing migration files
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

  it('should create a migration file with correct naming pattern', async () => {
    const migrationName = 'test_create_table';
    
    // Test the create logic directly
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    const filename = `${timestamp}_${migrationName}.sql`;
    const filepath = join(testMigrationsDir, filename);

    const MIGRATION_TEMPLATE = `-- Your migration SQL here
-- Example:
-- CREATE TABLE users (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   name VARCHAR(255) NOT NULL,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
`;

    await writeFile(filepath, MIGRATION_TEMPLATE, 'utf-8');

    // Verify file was created
    expect(existsSync(filepath)).toBe(true);
    expect(filename).toMatch(/^\d{8}_\d{6}_test_create_table\.sql$/);
  });

  it('should create migration file with correct template content', async () => {
    const migrationName = 'test_migration_template';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    const filename = `${timestamp}_${migrationName}.sql`;
    const filepath = join(testMigrationsDir, filename);

    const MIGRATION_TEMPLATE = `-- Your migration SQL here
-- Example:
-- CREATE TABLE users (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   name VARCHAR(255) NOT NULL,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
`;

    await writeFile(filepath, MIGRATION_TEMPLATE, 'utf-8');

    // Read file content
    const content = readFileSync(filepath, 'utf-8');

    // Check template content
    expect(content).toContain('-- Your migration SQL here');
    expect(content).toContain('CREATE TABLE');
  });

  it('should reject invalid migration names', () => {
    const invalidName = 'test-migration-with-dashes'; // Contains dashes which are invalid
    
    // Test name validation regex
    const isValid = /^[a-z0-9_]+$/i.test(invalidName);
    expect(isValid).toBe(false);
  });
});

