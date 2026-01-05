"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeGenerateAsync = executeGenerateAsync;
const common_1 = require("./common");
const generateDao_1 = require("./generateDao");
const generateModel_1 = require("./generateModel");
// execute generate command
async function executeGenerateAsync(conn, tables = [], options) {
    let db = (0, common_1.getDatabase)(conn);
    try {
        const schema = db.getDefaultSchema();
        // if -t is not provided, get all tables from the schema
        if (tables.length === 0) {
            tables = await db.getSchemaTables(schema);
        }
        await (0, generateModel_1.generateAndWriteModels)(db, tables, schema, options);
        await (0, generateDao_1.generateAndWriteDaos)(db, tables, schema, options);
    }
    finally {
        // Ensure database connection is closed
        await db.close();
    }
}
//# sourceMappingURL=generate.js.map