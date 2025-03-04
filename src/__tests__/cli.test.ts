import fs from 'fs';
import path from 'path';
import { getDbConfigFromEnv } from '../dao/DbConfigLoader';
import { executeGenerateAsync } from '../generator/generate';
import { CliOptions, GenerateType } from '../generator/Types';

const dbConfig = getDbConfigFromEnv();
const TEST_TABLE_USER = 'user';
const TEST_TABLE_NEWS = 'news';
const CONNECTION_STRING = `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

const TEST_OUTPUT_DIR = path.join(__dirname, './test-output');
const modelFileUser = path.join(TEST_OUTPUT_DIR, 'User.ts');
const daoFileUser = path.join(TEST_OUTPUT_DIR, 'UserDao.ts');
const modelFileNews = path.join(TEST_OUTPUT_DIR, 'News.ts');
const daoFileNews = path.join(TEST_OUTPUT_DIR, 'NewsDao.ts');

describe('CLI Generator Tests', () => {
    const originalLog = console.log;

    beforeAll(() => {
        console.log = jest.fn(); // Mock console.log with empty function
    });

    afterAll(() => {
        console.log = originalLog; // Restore original console.log
    });


    afterEach(() => {
        if (fs.existsSync(TEST_OUTPUT_DIR)) {
            fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
        }
    });

    it('should generate model and dao files', async () => {
        const options: CliOptions = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            outputDir: TEST_OUTPUT_DIR,
            modelDir: TEST_OUTPUT_DIR,
            daoDir: TEST_OUTPUT_DIR,
        };

        await testGenerate(options);
    });

    it('should generate model and dao files with custom output directory', async () => {
        const options = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            outputDir: TEST_OUTPUT_DIR
        };

        await testGenerate(options);
    });

    it('should generate model and dao files with custom model and dao output directory', async () => {
        const options = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            modelDir: TEST_OUTPUT_DIR,
            daoDir: TEST_OUTPUT_DIR,
        };
        await testGenerate(options);
    });

    it('should generate only model file', async () => {
        const options = {
            writeHeader: true,
            generateType: 'model' as GenerateType,
            outputDir: TEST_OUTPUT_DIR,
        };

        await executeGenerateAsync(
            CONNECTION_STRING,
            [TEST_TABLE_USER],
            options
        );

        expect(fs.existsSync(modelFileUser)).toBe(true);
        expect(fs.existsSync(daoFileUser)).toBe(false);

        // Check model file content
        const modelContent = fs.readFileSync(modelFileUser, 'utf-8');
        expect(modelContent).toContain('export interface User');
        expect(modelContent).toContain('id: number');
        expect(modelContent).toContain('username: string');
        expect(modelContent).toContain('email: string');
        expect(modelContent).toContain('created_at?: Date | null');
    });


    it('should generate only dao file', async () => {
        const options = {
            writeHeader: true,
            generateType: 'dao' as GenerateType,
            outputDir: TEST_OUTPUT_DIR,
        };

        await executeGenerateAsync(
            CONNECTION_STRING,
            [TEST_TABLE_USER],
            options
        );

        expect(fs.existsSync(modelFileUser)).toBe(false);
        expect(fs.existsSync(daoFileUser)).toBe(true);

        // Check dao file content
        const daoContent = fs.readFileSync(daoFileUser, 'utf-8');
        expect(daoContent).toContain('export class UserDao extends BaseDao<User>');
        expect(daoContent).toContain("table_name: 'user'");
    });

    it('should generate model and dao file of two tables', async () => {
        const options = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            outputDir: TEST_OUTPUT_DIR,
        };

        await executeGenerateAsync(
            CONNECTION_STRING,
            [TEST_TABLE_USER, TEST_TABLE_NEWS],
            options
        );

        // Check model file content
        expect(fs.existsSync(modelFileUser)).toBe(true);
        const modelContent = fs.readFileSync(modelFileUser, 'utf-8');
        expect(modelContent).toContain('export interface User');

        // Check dao file content of user
        expect(fs.existsSync(daoFileUser)).toBe(true);
        const daoContent = fs.readFileSync(daoFileUser, 'utf-8');
        expect(daoContent).toContain('export class UserDao extends BaseDao<User>');
        expect(daoContent).toContain("table_name: 'user'");

        expect(fs.existsSync(modelFileNews)).toBe(true);
        const modelContentNews = fs.readFileSync(modelFileNews, 'utf-8');
        expect(modelContentNews).toContain('export interface News');

        expect(fs.existsSync(daoFileNews)).toBe(true);
        // Check dao file content of news
        const newsContent = fs.readFileSync(daoFileNews, 'utf-8');
        expect(newsContent).toContain('export class NewsDao extends BaseDao<News>');
        expect(newsContent).toContain("table_name: 'news'");
    });

    it('should generate model and dao file of all tables if -t option is not given', async () => {
        const options = {
            writeHeader: true,
            generateType: 'all' as GenerateType,
            outputDir: TEST_OUTPUT_DIR,
        };

        await executeGenerateAsync(
            CONNECTION_STRING,
            [], // the tables name are not specified here.
            options
        );

        // Check model file content
        expect(fs.existsSync(modelFileUser)).toBe(true);
        const modelContent = fs.readFileSync(modelFileUser, 'utf-8');
        expect(modelContent).toContain('export interface User');

        // Check dao file content of user
        expect(fs.existsSync(daoFileUser)).toBe(true);
        const daoContent = fs.readFileSync(daoFileUser, 'utf-8');
        expect(daoContent).toContain('export class UserDao extends BaseDao<User>');
        expect(daoContent).toContain("table_name: 'user'");

        expect(fs.existsSync(modelFileNews)).toBe(true);
        const modelContentNews = fs.readFileSync(modelFileNews, 'utf-8');
        expect(modelContentNews).toContain('export interface News');

        expect(fs.existsSync(daoFileNews)).toBe(true);
        // Check dao file content of news
        const newsContent = fs.readFileSync(daoFileNews, 'utf-8');
        expect(newsContent).toContain('export class NewsDao extends BaseDao<News>');
        expect(newsContent).toContain("table_name: 'news'");
    });
});

async function testGenerate(options: CliOptions) {
    await executeGenerateAsync(
        CONNECTION_STRING,
        [TEST_TABLE_USER],
        options
    );

    expect(fs.existsSync(modelFileUser)).toBe(true);
    expect(fs.existsSync(daoFileUser)).toBe(true);

    // Check model file content
    const modelContent = fs.readFileSync(modelFileUser, 'utf-8');
    expect(modelContent).toContain('export interface User');
    expect(modelContent).toContain('id: number');
    expect(modelContent).toContain('username: string');
    expect(modelContent).toContain('email: string');
    expect(modelContent).toContain('created_at?: Date | null');

    // Check dao file content
    const daoContent = fs.readFileSync(daoFileUser, 'utf-8');
    expect(daoContent).toContain('export class UserDao extends BaseDao<User>');
    expect(daoContent).toContain("table_name: 'user'");
}
