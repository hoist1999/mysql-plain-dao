import { BaseDao } from "../../core/dao/BaseDao";
import { getDbConfigFromEnv } from "../../core/database/DbConfigLoader";
import { DbUtil } from '../../core/database/DbUtil';
import { InsertNews, News, enum_status } from '../generated_dao/News';
import { NewsDao } from '../generated_dao/NewsDao';
import { InsertUser, User } from '../generated_dao/User';
import { UserDao } from '../generated_dao/UserDao';
import { CategoryDao } from './../generated_dao/CategoryDao';

describe('NewsDao', () => {
    let newsDao: NewsDao;
    let userDao: UserDao;
    let categoryDao: CategoryDao;
    let testNews: InsertNews;
    let testAuthorId: string;
    let testUserItem: User | null;


    beforeAll(async () => {
        await DbUtil.initialize(getDbConfigFromEnv());

        await DbUtil.executeAsync('DELETE FROM news');
        await DbUtil.executeAsync('DELETE FROM user');

        newsDao = new NewsDao();
        userDao = new UserDao();
        categoryDao = new CategoryDao();
        // Prepare test user data with all possible fields from schema
        const testUser: InsertUser = {
            username: 'testuser',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            first_name: 'Test',
            last_name: 'User',
            phone: '+1234567890',
            is_active: true,
            role: 'user',
            last_login: new Date(),
            created_at: new Date(),
            updated_at: new Date()
        };
        testAuthorId = await userDao.insertAsync(testUser);
        testUserItem = await userDao.getByUuidAsync(testAuthorId);
    });

    afterAll(async () => {
        await DbUtil.executeAsync('DELETE FROM news');
        await DbUtil.executeAsync('DELETE FROM user');
        await DbUtil.endPoolAsync();
    });


    beforeEach(async () => {
        // Clear table data
        await DbUtil.executeAsync('DELETE FROM news');

        // Prepare test news data with valid author_id
        testNews = {
            title: 'Test News',
            content: 'Test Content',
            author_id: testUserItem!.id, // Use the created test user's ID
            status: 'draft',
            view_count: 0,
            published_at: null
        };
    });

    describe('Create operations', () => {
        it('should insert a new news with auto-increment ID and timestamps', async () => {
            const beforeInsert = new Date();
            const insertedId = await newsDao.insertAsync(testNews);
            const afterInsert = new Date();

            expect(insertedId).toBeDefined();
            expect(typeof insertedId).toBe('number');

            const insertedNews = await newsDao.getByIdAsync(insertedId!);
            expect(insertedNews).toBeDefined();

            // Test all fields including timestamps
            expect(insertedNews!.id).toBe(insertedId);
            expect(insertedNews!.title).toBe(testNews.title);
            expect(insertedNews!.content).toBe(testNews.content);
            expect(insertedNews!.author_id).toBe(testNews.author_id);
            expect(insertedNews!.status).toBe(testNews.status);
            expect(insertedNews!.view_count).toBe(testNews.view_count);

            // Timestamp checks
            const beforeInsertSeconds = Math.floor(beforeInsert.getTime() / 1000) * 1000;
            const afterInsertSeconds = Math.ceil(afterInsert.getTime() / 1000) * 1000;

            expect(insertedNews!.created_at).toBeDefined();
            expect(insertedNews!.updated_at).toBeDefined();

            const createdAtTime = insertedNews!.created_at!.getTime();
            const updatedAtTime = insertedNews!.updated_at!.getTime();

            expect(createdAtTime).toBeGreaterThanOrEqual(beforeInsertSeconds);
            expect(createdAtTime).toBeLessThanOrEqual(afterInsertSeconds);
            expect(updatedAtTime).toBe(createdAtTime);
        });
    });

    describe('Read operations', () => {
        let insertedId: number;

        beforeEach(async () => {
            insertedId = await newsDao.insertAsync(testNews) as number;
        });

        it('should get news by ID', async () => {
            const news = await newsDao.getByIdAsync(insertedId);
            expect(news).toBeDefined();
            expect(news!.title).toBe(testNews.title);
        });

        it('should return null for non-existent ID', async () => {
            const news = await newsDao.getByIdAsync(99999);
            expect(news).toBeNull();
        });
    });

    describe('Update operations', () => {
        let insertedNews: News;
        let originalCreatedAt: Date;
        let originalUpdatedAt: Date;

        beforeEach(async () => {
            const insertedId = await newsDao.insertAsync(testNews) as number;
            insertedNews = (await newsDao.getByIdAsync(insertedId))!;
            expect(insertedNews.created_at).toBeDefined();
            expect(insertedNews.updated_at).toBeDefined();
            originalCreatedAt = insertedNews.created_at!;
            originalUpdatedAt = insertedNews.updated_at!;
            // Wait 2 seconds to ensure updated_at will be different
            await new Promise(resolve => setTimeout(resolve, 2000));
        });

        it('should update news and update timestamps correctly', async () => {
            const beforeUpdate = new Date();
            const updatedData = {
                ...insertedNews,
                title: 'Updated News Title',
                content: 'Updated Content',
                status: 'published' as enum_status,
                view_count: 100,
                published_at: new Date(),
                updated_at: new Date()
            };

            await newsDao.updateAsync(updatedData);
            const afterUpdate = new Date();
            const updatedNews = await newsDao.getByIdAsync(insertedNews.id);

            // Test all updated fields
            expect(updatedNews).toBeDefined();
            expect(updatedNews!.title).toBe(updatedData.title);
            expect(updatedNews!.content).toBe(updatedData.content);
            expect(updatedNews!.status).toBe(updatedData.status);
            expect(updatedNews!.view_count).toBe(updatedData.view_count);
            expect(updatedNews!.published_at).toBeDefined();

            const updatedAtTime = Math.floor(updatedNews!.updated_at!.getTime() / 1000) * 1000;
            const beforeUpdateTime = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
            const afterUpdateTime = Math.ceil(afterUpdate.getTime() / 1000) * 1000;

            expect(updatedNews!.created_at!.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedAtTime).not.toBe(originalUpdatedAt.getTime());
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateTime);
            expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateTime);
        });
    });

    describe('Delete operations', () => {
        let insertedNews: News;

        beforeEach(async () => {
            const insertedId = await newsDao.insertAsync(testNews) as number;
            insertedNews = (await newsDao.getByIdAsync(insertedId))!;
        });

        it('should delete news by ID', async () => {
            await newsDao.deleteByIdAsync(insertedNews.id);
            const deletedNews = await newsDao.getByIdAsync(insertedNews.id);
            expect(deletedNews).toBeNull();
        });
    });

    describe('Bulk insert operations', () => {
        it('should bulk insert news', async () => {
            // Create 10 news items
            const newsItems = Array.from({ length: 10 }, (_, i) => ({
                ...testNews,
                title: `Test News ${i}`,
                content: `Test Content ${i}`,
                view_count: i * 10
            }));
            await newsDao.bulkInsertAsync(newsItems);

            // Get all news
            const allNews = await newsDao.getListAsync();
            expect(allNews.length).toBe(10);

            // Clean news table
            await DbUtil.executeAsync('DELETE FROM news');
        });
    });


    // userdao with custom uuid field
    describe('UserDao with custom UUID field', () => {
        it('should bulk insert users with custom UUID field', async () => {
            class CustomNewsDao extends BaseDao<News, InsertNews> {
                constructor() {
                    super({
                        table_name: 'news',
                        id_field: 'id'
                    });
                }
            }

            const tempNewsDao = new CustomNewsDao();
            const insertedId = await tempNewsDao.insertAsync(testNews);
            const insertedNews = await tempNewsDao.getByIdAsync(insertedId!);
            expect(insertedNews).toBeDefined();
            expect(insertedNews!.id).toBe(insertedId);
        });
    });

    // getTotalCountAsync
    it('should get total count', async () => {
        await newsDao.insertAsync({ ...testNews, title: 'Test News 1' });
        await newsDao.insertAsync({ ...testNews, title: 'Test News 2' });
        const totalCount = await newsDao.getTotalCountAsync();
        expect(totalCount).toBe(2);
    });


    // get max sort order
    it('should get max sort order', async () => {
        // clear table category
        await DbUtil.executeAsync('DELETE FROM category');

        // insert 3 categories
        await categoryDao.insertAsync({ name: 'Test Category 1', sort_order: 0 });
        await categoryDao.insertAsync({ name: 'Test Category 2', sort_order: 1 });
        await categoryDao.insertAsync({ name: 'Test Category 3', sort_order: 2 });

        const maxSortOrder = await categoryDao.getMaxSortOrderAsync();
        expect(maxSortOrder).toBe(2);

        // clear table category
        await DbUtil.executeAsync('DELETE FROM category');
    });

}); 