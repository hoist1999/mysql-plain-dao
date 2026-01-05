#! /usr/bin/env node
"use strict";
/**
 * Command Line Interface for MySQL Plain DAO
 *
 * This CLI tool provides multiple functionalities:
 * - Generate TypeScript models and DAO classes from MySQL database tables
 * - Manage database migrations (create, run, status)
 *
 * Example usage:
 *   # Generate models and DAO
 *   npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/
 *
 *   # Migration commands
 *   npx mysql-plain-dao migrate create add_users_table
 *   npx mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/dbname
 *   npx mysql-plain-dao migrate status -c mysql://user:pass@localhost:3306/dbname
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generate_1 = require("./generator/generate");
const fs_1 = require("fs");
const path_1 = require("path");
const migrateUp_1 = require("./migrations/commands/migrateUp");
const migrateStatus_1 = require("./migrations/commands/migrateStatus");
const migrateCreate_1 = require("./migrations/commands/migrateCreate");
const program = new commander_1.Command();
// Read version from package.json
let version = '0.1.2-beta.34'; // Default version as fallback
try {
    // Try multiple possible locations for package.json
    const possiblePaths = [
        (0, path_1.join)(__dirname, '../../package.json'),
        (0, path_1.join)(__dirname, '../../../package.json'),
        (0, path_1.join)(process.cwd(), 'package.json')
    ];
    for (const path of possiblePaths) {
        try {
            const content = (0, fs_1.readFileSync)(path, 'utf-8');
            const pkg = JSON.parse(content);
            version = pkg.version;
            break;
        }
        catch (e) {
            continue;
        }
    }
}
catch (e) {
    // Fallback to default version if all attempts fail
    console.warn('Warning: Could not read package.json version, using default version');
}
(async () => {
    program
        .name('mysql-plain-dao')
        .description('MySQL Plain DAO - Generate TypeScript models, DAO, and manage database migrations')
        .version(version);
    // Generate command (backward compatible)
    const generateCommand = new commander_1.Command('generate')
        .alias('gen')
        .description('Generate TypeScript models and DAO from MySQL database tables')
        .addOption(new commander_1.Option('-c, --conn <connection>', 'Database connection string (MySQL)')
        .env('DAO_CONN')
        .makeOptionMandatory())
        .addOption(new commander_1.Option('-t, --table <tables...>', 'table name(s) to generate interfaces for')
        .env('DAO_TABLE'))
        .addOption(new commander_1.Option('-o, --output <dir>', 'output directory for generated files')
        .env('DAO_OUTPUT'))
        .addOption(new commander_1.Option('-g, --generate <type>', 'generation type (model, dao, or all)')
        .env('DAO_GENERATE')
        .default('all')
        .choices(['model', 'dao', 'all']))
        .addOption(new commander_1.Option('--no-header', 'skip writing file header comment')
        .env('DAO_NO_HEADER'))
        .addOption(new commander_1.Option('--model-dir <dir>', 'output directory for model files (overrides -o for models)')
        .env('DAO_MODEL_DIR'))
        .addOption(new commander_1.Option('--dao-dir <dir>', 'output directory for DAO files (overrides -o for DAOs)')
        .env('DAO_DAO_DIR'))
        .action(async (options) => {
        try {
            // 如果环境变量中的 TABLE 是逗号分隔的字符串，需要转换为数组
            const tables = Array.isArray(options.table)
                ? options.table
                : options.table?.split(',').filter(Boolean) || [];
            const cliOptions = {
                writeHeader: options.header !== false,
                generateType: options.generate,
                outputDir: options.output,
                modelDir: options.modelDir || '',
                daoDir: options.daoDir || '',
            };
            await (0, generate_1.executeGenerateAsync)(options.conn, tables, cliOptions);
            console.log('✨ Generation completed successfully!');
            process.exit(0);
        }
        catch (e) {
            console.error('\n❌ Generation failed:');
            // Display the user-friendly error message
            if (e.message) {
                console.error('\n' + e.message);
                console.error(e.stack);
            }
            else {
                console.error('An unexpected error occurred during generation.');
            }
            // Add helpful tips based on common issues
            console.error('\n📋 Troubleshooting tips:');
            console.error('1. Make sure MySQL server is running');
            console.error('2. Verify your connection string format:');
            console.error('   mysql://user:password@host:port/database');
            console.error('3. Check if you have proper permissions');
            console.error('\nFor more help, visit: https://github.com/hoist1999/mysql-plain-dao\n');
            process.exit(1);
        }
    });
    // Migrate command
    const migrateCommand = new commander_1.Command('migrate')
        .description('Database migration commands')
        .addCommand((0, migrateUp_1.createMigrateUpCommand)())
        .addCommand((0, migrateStatus_1.createMigrateStatusCommand)())
        .addCommand((0, migrateCreate_1.createMigrateCreateCommand)());
    // Add commands to program
    program.addCommand(generateCommand);
    program.addCommand(migrateCommand);
    // Backward compatibility: if no command specified, treat as generate
    program
        .addOption(new commander_1.Option('-c, --conn <connection>', 'Database connection string (MySQL)')
        .env('DAO_CONN'))
        .addOption(new commander_1.Option('-t, --table <tables...>', 'table name(s) to generate interfaces for')
        .env('DAO_TABLE'))
        .addOption(new commander_1.Option('-o, --output <dir>', 'output directory for generated files')
        .env('DAO_OUTPUT'))
        .addOption(new commander_1.Option('-g, --generate <type>', 'generation type (model, dao, or all)')
        .env('DAO_GENERATE')
        .default('all')
        .choices(['model', 'dao', 'all']))
        .addOption(new commander_1.Option('--no-header', 'skip writing file header comment')
        .env('DAO_NO_HEADER'))
        .addOption(new commander_1.Option('--model-dir <dir>', 'output directory for model files (overrides -o for models)')
        .env('DAO_MODEL_DIR'))
        .addOption(new commander_1.Option('--dao-dir <dir>', 'output directory for DAO files (overrides -o for DAOs)')
        .env('DAO_DAO_DIR'))
        .action(async (options) => {
        // If no subcommand and connection is provided, run generate
        if (options.conn) {
            try {
                const tables = Array.isArray(options.table)
                    ? options.table
                    : options.table?.split(',').filter(Boolean) || [];
                const cliOptions = {
                    writeHeader: options.header !== false,
                    generateType: options.generate,
                    outputDir: options.output,
                    modelDir: options.modelDir || '',
                    daoDir: options.daoDir || '',
                };
                await (0, generate_1.executeGenerateAsync)(options.conn, tables, cliOptions);
                console.log('✨ Generation completed successfully!');
                process.exit(0);
            }
            catch (e) {
                console.error('\n❌ Generation failed:');
                if (e.message) {
                    console.error('\n' + e.message);
                    console.error(e.stack);
                }
                else {
                    console.error('An unexpected error occurred during generation.');
                }
                process.exit(1);
            }
        }
    });
    program.addHelpText('after', `
Examples:
  # Generate models and DAO (backward compatible)
  $ mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/
  
  # Generate using subcommand
  $ mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/
  
  # Migration commands
  $ mysql-plain-dao migrate create add_users_table
  $ mysql-plain-dao migrate up -c mysql://user:pass@localhost:3306/dbname
  $ mysql-plain-dao migrate status -c mysql://user:pass@localhost:3306/dbname

Environment Variables:
  DAO_CONN        Database connection string
  DAO_TABLE       Comma-separated table names
  DAO_OUTPUT      Output directory
  DAO_GENERATE    Generation type (model, dao, or all)
  DAO_MODEL_DIR   Model files output directory
  DAO_DAO_DIR     DAO files output directory
  DAO_NO_HEADER   Skip header comment if 'true'
  DAO_MIGRATIONS_DIR  Migrations directory (default: migrations)

Please visit online documentation for more usage examples:
https://github.com/hoist1999/mysql-plain-dao`);
    program.parse();
})().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map