#! /usr/bin/env node
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
 *   npx mysql-plain-dao migrate-create add_users_table
 *   npx mysql-plain-dao migrate-up -c mysql://user:pass@localhost:3306/dbname
 *   npx mysql-plain-dao migrate-status -c mysql://user:pass@localhost:3306/dbname
 */
import { Command, Option } from 'commander';
import { executeGenerateAsync } from './generator/generate';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createMigrateUpCommand } from './migrations/commands/migrateUp';
import { createMigrateStatusCommand } from './migrations/commands/migrateStatus';
import { createMigrateCreateCommand } from './migrations/commands/migrateCreate';
const program = new Command();
// Read version from package.json
let version = '0.1.2-beta.34'; // Default version as fallback
try {
    // Try multiple possible locations for package.json
    const possiblePaths = [
        join(__dirname, '../../package.json'),
        join(__dirname, '../../../package.json'),
        join(process.cwd(), 'package.json')
    ];
    for (const path of possiblePaths) {
        try {
            const content = readFileSync(path, 'utf-8');
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
    // Generate command
    const generateCommand = new Command('generate')
        .alias('gen')
        .description('Generate TypeScript models and DAO from MySQL database tables')
        .addOption(new Option('-c, --conn <connection>', 'Database connection string (MySQL)')
        .env('DAO_CONN')
        .makeOptionMandatory())
        .addOption(new Option('-t, --table <tables...>', 'table name(s) to generate interfaces for')
        .env('DAO_TABLE'))
        .addOption(new Option('-o, --output <dir>', 'output directory for generated files')
        .env('DAO_OUTPUT'))
        .addOption(new Option('-g, --generate <type>', 'generation type (model, dao, or all)')
        .env('DAO_GENERATE')
        .default('all')
        .choices(['model', 'dao', 'all']))
        .addOption(new Option('--no-header', 'skip writing file header comment')
        .env('DAO_NO_HEADER'))
        .addOption(new Option('--model-dir <dir>', 'output directory for model files (overrides -o for models)')
        .env('DAO_MODEL_DIR'))
        .addOption(new Option('--dao-dir <dir>', 'output directory for DAO files (overrides -o for DAOs)')
        .env('DAO_DAO_DIR'))
        .action(async (options) => {
        try {
            // If DAO_TABLE comes from env as comma-separated, normalize to array.
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
            await executeGenerateAsync(options.conn, tables, cliOptions);
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
    // Add commands to program
    program.addCommand(generateCommand);
    program.addCommand(createMigrateUpCommand('migrate-up'));
    program.addCommand(createMigrateStatusCommand('migrate-status'));
    program.addCommand(createMigrateCreateCommand('migrate-create'));
    // Deprecated (backward compatible) migrate group.
    const migrateCommand = new Command('migrate')
        .description('[DEPRECATED] Use migrate-up / migrate-status / migrate-create instead')
        .addCommand(createMigrateUpCommand('up'))
        .addCommand(createMigrateStatusCommand('status'))
        .addCommand(createMigrateCreateCommand('create'));
    program.addCommand(migrateCommand);
    program.addHelpText('after', `
Examples:
  # Generate using subcommand
  $ mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/
  
  # Migration commands
  $ mysql-plain-dao migrate-create add_users_table
  $ mysql-plain-dao migrate-up -c mysql://user:pass@localhost:3306/dbname
  $ mysql-plain-dao migrate-status -c mysql://user:pass@localhost:3306/dbname

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