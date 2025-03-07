import { BaseDaoUUID } from '../../dao/BaseDaoUUID';
import { getDbConfigFromEnv } from "../../dao/DbConfigLoader";
import { DbUtil } from '../../dao/DbUtil';
import { Book, InsertBook } from "../generated_dao/Book";
import { BookDao } from "../generated_dao/BookDao";


// Test book table which has only uuid field as primary key
describe('BookDao', () => {
    let bookDao: BookDao;
    let testBook: InsertBook;

    beforeAll(async () => {
        await DbUtil.initialize(getDbConfigFromEnv());
        bookDao = new BookDao();
    });

    afterAll(async () => {
        await DbUtil.endPoolAsync();
    });

    beforeEach(async () => {
        // Clear table data
        await DbUtil.executeAsync('DELETE FROM book');

        // Prepare test book data
        testBook = {
            title: 'Test Book',
            author_id: 1,
            created_at: new Date(),
            updated_at: new Date()
        };
    });

    describe('Create operations', () => {
        it('should insert a new book with UUID and timestamps', async () => {
            const beforeInsert = new Date();
            const insertedUserUUID = await bookDao.insertAsync(testBook);
            const afterInsert = new Date();

            const insertedBook = await bookDao.getByUuidAsync(insertedUserUUID);
            expect(insertedBook).toBeDefined();

            // Test all fields including timestamps
            expect(insertedBook!.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            expect(insertedBook!.title).toBe(testBook.title);
            expect(insertedBook!.author_id).toBe(testBook.author_id);

            // Timestamp checks
            const beforeInsertSeconds = Math.floor(beforeInsert.getTime() / 1000) * 1000;
            const afterInsertSeconds = Math.ceil(afterInsert.getTime() / 1000) * 1000;

            expect(insertedBook).toBeDefined();
            expect(insertedBook!.created_at).toBeDefined();
            expect(insertedBook!.updated_at).toBeDefined();

            const createdAtTime = insertedBook!.created_at!.getTime();
            const updatedAtTime = insertedBook!.updated_at!.getTime();

            expect(createdAtTime).toBeGreaterThanOrEqual(beforeInsertSeconds);
            expect(createdAtTime).toBeLessThanOrEqual(afterInsertSeconds);
            expect(updatedAtTime).toBe(createdAtTime);
        });
    });

    describe('Read operations', () => {
        let insertedUuid: string;

        beforeEach(async () => {
            insertedUuid = await bookDao.insertAsync(testBook);
        });

        it('should get book by UUID', async () => {
            const book = await bookDao.getByUuidAsync(insertedUuid);
            expect(book).toBeDefined();
            expect(book!.title).toBe(testBook.title);
        });

        it('should return null for non-existent UUID', async () => {
            const book = await bookDao.getByUuidAsync('non-existent-uuid');
            expect(book).toBeNull();
        });
    });

    describe('Update operations', () => {
        let insertedBook: Book;
        let originalCreatedAt: Date;
        let originalUpdatedAt: Date;

        beforeEach(async () => {
            const insertedUuid = await bookDao.insertAsync(testBook);
            insertedBook = (await bookDao.getByUuidAsync(insertedUuid))!;
            expect(insertedBook.created_at).toBeDefined();
            expect(insertedBook.updated_at).toBeDefined();
            originalCreatedAt = insertedBook.created_at!;
            originalUpdatedAt = insertedBook.updated_at!;
            // Wait 2 seconds to ensure updated_at will be different
            await new Promise(resolve => setTimeout(resolve, 2000));
        });

        it('should update book by ID and update timestamps correctly', async () => {
            const beforeUpdate = new Date();
            const updatedData = {
                ...insertedBook,
                title: 'Updated Book Title',
                author_id: 2,
                updated_at: new Date()
            };

            await bookDao.updateAsync(updatedData);
            const afterUpdate = new Date();
            const updatedBook = await bookDao.getByUuidAsync(insertedBook.uuid);

            // Test all updated fields
            expect(updatedBook).toBeDefined();
            expect(updatedBook!.created_at).toBeDefined();
            expect(updatedBook!.updated_at).toBeDefined();

            const updatedAtTime = Math.floor(updatedBook!.updated_at!.getTime() / 1000) * 1000;
            const beforeUpdateTime = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
            const afterUpdateTime = Math.ceil(afterUpdate.getTime() / 1000) * 1000;

            expect(updatedBook!.created_at!.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedAtTime).not.toBe(originalUpdatedAt.getTime());
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateTime);
            expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateTime);
        });

        it('should update book by UUID and update timestamps correctly', async () => {
            const beforeUpdate = new Date();
            const updatedData = {
                ...insertedBook,
                title: 'Updated Book Title',
                author_id: 2,
                updated_at: new Date()
            };

            await bookDao.updateAsync(updatedData);
            const afterUpdate = new Date();
            const updatedBook = await bookDao.getByUuidAsync(insertedBook.uuid);

            // Test all updated fields
            expect(updatedBook).toBeDefined();
            expect(updatedBook!.created_at).toBeDefined();
            expect(updatedBook!.updated_at).toBeDefined();

            const updatedAtTime = Math.floor(updatedBook!.updated_at!.getTime() / 1000) * 1000;
            const beforeUpdateTime = Math.floor(beforeUpdate.getTime() / 1000) * 1000;
            const afterUpdateTime = Math.ceil(afterUpdate.getTime() / 1000) * 1000;

            expect(updatedBook!.created_at!.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedAtTime).not.toBe(originalUpdatedAt.getTime());
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdateTime);
            expect(updatedAtTime).toBeLessThanOrEqual(afterUpdateTime);
        });
    });

    describe('Delete operations', () => {
        let insertedBook: Book;

        beforeEach(async () => {
            const insertedUserUUID = await bookDao.insertAsync(testBook);
            insertedBook = (await bookDao.getByUuidAsync(insertedUserUUID))!;
        });

        it('should delete book by UUID', async () => {
            await bookDao.deleteByUuidAsync(insertedBook.uuid);
            const deletedBook = await bookDao.getByUuidAsync(insertedBook.uuid);
            expect(deletedBook).toBeNull();
        });
    });

    describe('Bulk insert operations', () => {
        it('should bulk insert books', async () => {
            // Create 10 books
            const books = Array.from({ length: 10 }, (_, i) => ({
                ...testBook,
                title: `Test Book ${i}`,
                author_id: i + 1
            }));
            await bookDao.bulkInsertAsync(books);

            // Get all books
            const allBooks = await bookDao.getListAsync();
            expect(allBooks.length).toBe(10);

            // Clean book table
            await DbUtil.executeAsync('DELETE FROM book');
        });
    });

    describe('BookDao with custom UUID field', () => {
        it('should insert book with custom UUID field', async () => {
            class CustomBookDao extends BaseDaoUUID<Book, InsertBook> {
                constructor() {
                    super({
                        table_name: 'book',
                        uuid_field: 'uuid'
                    });
                }
            }

            const tempBookDao = new CustomBookDao();
            const insertBookUuid = await tempBookDao.insertAsync(testBook);

            expect(insertBookUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            const insertedBook = await tempBookDao.getByUuidAsync(insertBookUuid!);
            expect(insertedBook).toBeDefined();
            expect(insertedBook!.uuid).toBeDefined();
            expect(insertedBook!.uuid).toBe(insertBookUuid);
        });
    });
});
