"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMigrateCreateCommand = createMigrateCreateCommand;
const commander_1 = require("commander");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const MIGRATION_TEMPLATE = `-- Your migration SQL here
-- Example:
-- CREATE TABLE users (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   name VARCHAR(255) NOT NULL,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
`;
function createMigrateCreateCommand() {
    const command = new commander_1.Command('create');
    command
        .description('Create a new migration file')
        .argument('<name>', 'Migration name (e.g., add_users_table)')
        .addOption(new commander_1.Option('--migrations-dir <dir>', 'Migrations directory')
        .env('DAO_MIGRATIONS_DIR')
        .default('migrations'))
        .action(async (name, options) => {
        try {
            // Validate name
            if (!/^[a-z0-9_]+$/i.test(name)) {
                throw new Error('Migration name can only contain letters, numbers, and underscores');
            }
            // Resolve migrations directory
            const migrationsDir = (0, path_1.resolve)(process.cwd(), options.migrationsDir);
            // Create directory if it doesn't exist
            if (!(0, fs_1.existsSync)(migrationsDir)) {
                await (0, promises_1.mkdir)(migrationsDir, { recursive: true });
            }
            // Generate timestamp
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
            // Generate filename
            const filename = `${timestamp}_${name}.sql`;
            const filepath = (0, path_1.join)(migrationsDir, filename);
            // Write file
            await (0, promises_1.writeFile)(filepath, MIGRATION_TEMPLATE, 'utf-8');
            console.log(`✅ Created migration: ${filepath}`);
            process.exit(0);
        }
        catch (error) {
            console.error('\n❌ Failed to create migration:');
            if (error.message) {
                console.error(error.message);
            }
            else {
                console.error('An unexpected error occurred.');
            }
            if (error.stack) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });
    return command;
}
//# sourceMappingURL=migrateCreate.js.map