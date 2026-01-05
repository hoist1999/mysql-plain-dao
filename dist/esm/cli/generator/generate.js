import { getDatabase } from './common';
import { generateAndWriteDaos } from './generateDao';
import { generateAndWriteModels } from './generateModel';
// execute generate command
export async function executeGenerateAsync(conn, tables = [], options) {
    let db = getDatabase(conn);
    try {
        const schema = db.getDefaultSchema();
        // if -t is not provided, get all tables from the schema
        if (tables.length === 0) {
            tables = await db.getSchemaTables(schema);
        }
        await generateAndWriteModels(db, tables, schema, options);
        await generateAndWriteDaos(db, tables, schema, options);
    }
    finally {
        // Ensure database connection is closed
        await db.close();
    }
}
//# sourceMappingURL=generate.js.map