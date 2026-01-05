import { getDatabase } from './common'
import { generateAndWriteDaos } from './generateDao'
import { generateAndWriteModels } from './generateModel'
import type { CliOptions, Database } from './Types'


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
