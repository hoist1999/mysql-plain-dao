import fs from 'fs';
import path from 'path';
import { getDbConfigFromEnv } from '../core/database/DbConfigLoader';
import { executeGenerateAsync } from '../cli/generator/generate';
import { CliOptions, GenerateType } from '../cli/generator/Types';

const dbConfig = getDbConfigFromEnv();
const CONNECTION_STRING = `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

const TEST_OUTPUT_DIR = path.join(__dirname, '../../test-output');
const MODEL_DIR = path.join(TEST_OUTPUT_DIR, 'model');
const DAO_DIR = path.join(TEST_OUTPUT_DIR, 'dao');

// Define array of files to check
const expectedModelFiles = [
    path.join(MODEL_DIR, 'News.ts'),
    path.join(MODEL_DIR, 'User.ts'),
    path.join(MODEL_DIR, 'UserPermission.ts'),
    path.join(MODEL_DIR, 'Book.ts'),
    path.join(MODEL_DIR, 'Category.ts'),
];

const expectedDaoFiles = [
    path.join(DAO_DIR, 'NewsDao.ts'),
    path.join(DAO_DIR, 'UserDao.ts'),
    path.join(DAO_DIR, 'UserPermissionDao.ts'),
    path.join(DAO_DIR, 'BookDao.ts'),
    path.join(DAO_DIR, 'CategoryDao.ts'),
];

describe('Generate model and dao files in different directories', () => {
    const originalLog = console.log;

    beforeAll(() => {
        console.log = jest.fn(); // Mock console.log with empty function
    });

    beforeEach(() => {
        // Clean up test output directory before each test
        if (fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
        }
        fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    });

    afterAll(() => {
        // Restore original console.log
        console.log = originalLog;
        
        // Clean up test output directory after all tests
        if (fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
        }
    });

    it('should generate model and dao files in different directories', async () => {
        // Ensure directories exist before generation
        fs.mkdirSync(MODEL_DIR, { recursive: true });
        fs.mkdirSync(DAO_DIR, { recursive: true });

        const options: CliOptions = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            modelDir: MODEL_DIR,
            daoDir: DAO_DIR,
        };

        // Execute the generate command (equivalent to: pnpm start -c "$CONNECTION_STRING" --model-dir ./test-output/model --dao-dir ./test-output/dao)
        await executeGenerateAsync(
            CONNECTION_STRING,
            [], // Generate all tables
            options
        );

        // Check if all model files exist
        const missingModelFiles: string[] = [];
        for (const file of expectedModelFiles) {
            if (!fs.existsSync(file)) {
                missingModelFiles.push(file);
            }
        }

        // Check if all dao files exist
        const missingDaoFiles: string[] = [];
        for (const file of expectedDaoFiles) {
            if (!fs.existsSync(file)) {
                missingDaoFiles.push(file);
            }
        }

        if (missingModelFiles.length > 0 || missingDaoFiles.length > 0) {
            // List all files that were actually generated
            const actualModelFiles = fs.existsSync(MODEL_DIR)
                ? fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'))
                : [];
            const actualDaoFiles = fs.existsSync(DAO_DIR)
                ? fs.readdirSync(DAO_DIR).filter(f => f.endsWith('.ts'))
                : [];
            throw new Error(
                `Missing model files: ${missingModelFiles.join(', ')}\n` +
                `Missing dao files: ${missingDaoFiles.join(', ')}\n` +
                `Actual model files generated: ${actualModelFiles.join(', ')}\n` +
                `Actual dao files generated: ${actualDaoFiles.join(', ')}`
            );
        }
    });
});

