#! /usr/bin/env node
/**
 * Command Line Interface for Database Model Generator
 * 
 * This tool automatically generates TypeScript models/interfaces from existing MySQL database tables.
 * It helps maintain type safety by creating type definitions that match your database schema.
 * 
 * Example usage:
 * MySQL:     schemats -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
 * Or using npx:
 *           npx mysql-plain-dao generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
 */

import { Command, Option } from 'commander';
import type { CliOptions, GenerateType } from './Types';
import { executeGenerateAsync } from './generate';

const program = new Command();

(async () => {
    program
        .name('mysql-plain-dao')
        .description('Generate TypeScript models and DAO from MySQL database tables')
        .version('1.0.0');

    program
        .addOption(
            new Option('-c, --conn <connection>', 'Database connection string (MySQL)')
                .env('DAO_CONN')
                .makeOptionMandatory()
        )
        .addOption(
            new Option('-t, --table <tables...>', 'table name(s) to generate interfaces for')
                .env('DAO_TABLE')
        )
        .addOption(
            new Option('-o, --output <dir>', 'output directory for generated files')
                .env('DAO_OUTPUT')
                .makeOptionMandatory()
        )
        .addOption(
            new Option('-g, --generate <type>', 'generation type (model, dao, or all)')
                .env('DAO_GENERATE')
                .default('all')
                .choices(['model', 'dao', 'all'])
        )
        .addOption(
            new Option('--no-header', 'skip writing file header comment')
                .env('DAO_NO_HEADER')
        )
        .addOption(
            new Option('--model-dir <dir>', 'output directory for model files (overrides -o for models)')
                .env('DAO_MODEL_DIR')
        )
        .addOption(
            new Option('--dao-dir <dir>', 'output directory for DAO files (overrides -o for DAOs)')
                .env('DAO_DAO_DIR')
        );

    program.addHelpText('after', `
Example:
  $ mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/

Environment Variables:
  DAO_CONN        Database connection string
  DAO_TABLE       Comma-separated table names
  DAO_OUTPUT      Output directory
  DAO_GENERATE    Generation type (model, dao, or all)
  DAO_MODEL_DIR   Model files output directory
  DAO_DAO_DIR     DAO files output directory
  DAO_NO_HEADER   Skip header comment if 'true'

Please visit online documentation for more usage examples:
https://github.com/hoist1999/mysql-plain-dao`);

    program.parse();

    const options = program.opts();

    try {
        // 如果环境变量中的 TABLE 是逗号分隔的字符串，需要转换为数组
        const tables = Array.isArray(options.table)
            ? options.table
            : options.table?.split(',').filter(Boolean) || [];

        const cliOptions: CliOptions = {
            writeHeader: options.header !== false,
            generateType: options.generate as GenerateType,
            outputDir: options.output,
            modelDir: options.modelDir || '',
            daoDir: options.daoDir || '',
        };

        await executeGenerateAsync(
            options.conn,
            tables,
            cliOptions
        );

        console.log('Generation completed successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Error during generation:', e);
        process.exit(1);
    }
})().catch((e: any) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
