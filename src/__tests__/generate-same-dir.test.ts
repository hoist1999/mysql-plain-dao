import fs from 'fs';
import path from 'path';
import { getDbConfigFromEnv } from '../core/database/DbConfigLoader';
import { executeGenerateAsync } from '../cli/generator/generate';
import { CliOptions, GenerateType } from '../cli/generator/Types';

const dbConfig = getDbConfigFromEnv();
const CONNECTION_STRING = `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

const TEST_OUTPUT_DIR = path.join(__dirname, '../../test-output');

// Define array of files to check
const expectedFiles = [
    path.join(TEST_OUTPUT_DIR, 'News.ts'),
    path.join(TEST_OUTPUT_DIR, 'NewsDao.ts'),
    path.join(TEST_OUTPUT_DIR, 'User.ts'),
    path.join(TEST_OUTPUT_DIR, 'UserDao.ts'),
    path.join(TEST_OUTPUT_DIR, 'UserPermission.ts'),
    path.join(TEST_OUTPUT_DIR, 'UserPermissionDao.ts'),
    path.join(TEST_OUTPUT_DIR, 'Book.ts'),
    path.join(TEST_OUTPUT_DIR, 'BookDao.ts'),
    path.join(TEST_OUTPUT_DIR, 'Category.ts'),
    path.join(TEST_OUTPUT_DIR, 'CategoryDao.ts'),
];

describe('Generate model and dao files in the same directory', () => {
    const originalLog = console.log;

    beforeAll(() => {
        console.log = jest.fn(); // Mock console.log with empty function
    });

    afterAll(() => {
        console.log = originalLog; // Restore original console.log
    });

    beforeEach(() => {
        // Clean up test output directory before each test
        if (fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
        }
        fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    });

    afterAll(() => {
        // Clean up test output directory after all tests
        if (fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
        }
    });

    it('should generate model and dao files in the same directory', async () => {
        const options: CliOptions = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            outputDir: TEST_OUTPUT_DIR,
        };

        // Execute the generate command (equivalent to: pnpm start -c "$CONNECTION_STRING" -o ./test-output)
        await executeGenerateAsync(
            CONNECTION_STRING,
            [], // Generate all tables
            options
        );

        // Check if all files exist
        const missingFiles: string[] = [];
        for (const file of expectedFiles) {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            // List all files that were actually generated
            const actualFiles = fs.existsSync(TEST_OUTPUT_DIR)
                ? fs.readdirSync(TEST_OUTPUT_DIR).filter(f => f.endsWith('.ts'))
                : [];
            throw new Error(
                `Missing files: ${missingFiles.join(', ')}\n` +
                `Actual files generated: ${actualFiles.join(', ')}`
            );
        }
    });
});

