import { getDatabase } from './common.js'
import { generateAndWriteDaos } from './generateDao.js'
import { generateAndWriteModels } from './generateModel.js'
import type { CliOptions, Database } from './Types.js'


// execute generate command
export async function executeGenerateAsync(
    conn: string,
    tables: string[] = [],
    options: CliOptions
): Promise<void> {
    let db: Database = getDatabase(conn);

    try {
        const schema = db.getDefaultSchema();

        // if -t is not provided, get all tables from the schema
        if (tables.length === 0) {
            tables = await db.getSchemaTables(schema)
        }

        await generateAndWriteModels(
            db,
            tables,
            schema,
            options);

        await generateAndWriteDaos(
            db,
            tables,
            schema,
            options
        );
    } finally {
        // Ensure database connection is closed
        await db.close();
    }
}
