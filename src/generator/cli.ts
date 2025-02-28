#! /usr/bin/env node
/**
 * Command Line Interface for Database Model Generator
 * 
 * This tool automatically generates TypeScript models/interfaces from existing MySQL database tables.
 * It helps maintain type safety by creating type definitions that match your database schema.
 * 
 * Example usage:
 * MySQL:     schemats -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
 */

import chalk from 'chalk'
import yargs from 'yargs'
import { generateAndWriteDaos } from './generateDao'
import { generateAndWriteModels } from './generateModel'
import { getDatabase } from './common'
import { CliOptions, GenerateType, Database } from './Types'

(async () => {
    let argv = yargs
        .locale('en')
        .usage(`${chalk.bold('Generate TypeScript models from MySQL database tables.')}

Usage: ${chalk.cyan('$0')} ${chalk.yellow('[options]')}

Please visit documentation https://github.com/hoist1999/mysql-plain-dao for usage examples.`)
        .global('config')
        .default('config', 'schemats.json')
        .config()
        .env('SCHEMATS')

        // database connection string: required
        .demand('c')
        .alias('c', 'conn')
        .nargs('c', 1)
        .describe('c', 'Database connection string (MySQL)')

        // table name(s): required
        .alias('t', 'table')
        .nargs('t', 1)
        .describe('t', 'table name(s) to generate interfaces for')

        // generate type: optional
        .alias('g', 'generate')
        .describe('g', 'generation type (model, dao, or all)')
        .choices('g', ['model', 'dao', 'all'])
        .default('g', 'all')

        // schema name: optional    
        .alias('s', 'schema')
        .nargs('s', 1)
        .describe('s', 'database schema name')

        // skip writing file header comment: optional
        .describe('noHeader', 'skip writing file header comment')

        // output directory for generated files
        .demand('o')
        .nargs('o', 1)
        .alias('o', 'output')
        .describe('o', 'output directory for generated files')

        // output directory for model files
        .describe('model-dir', 'output directory for model files (overrides -o for models)')
        .default('model-dir', null)

        // output directory for DAO files  
        .describe('dao-dir', 'output directory for DAO files (overrides -o for DAOs)')
        .default('dao-dir', null)

        // help: optional
        .help('h')
        .alias('h', 'help')
        .showHelpOnFail(true, 'Specify --help for available options')
        .recommendCommands()
        .strict();

    const args = await argv.argv;

    try {
        // 确保 table 是数组
        const tables = Array.isArray(args.table) ? args.table : [args.table];

        // 构建选项对象
        const options: CliOptions = {
            writeHeader: !args.noHeader,
            generateType: (args.g as GenerateType),
            outputDir: args.output as string,
            modelDir: args.modelDir || "",
            daoDir: args.daoDir || "",
        };

        await executeGenerateAsync(
            args.conn as string,
            tables,
            args.schema as string,
            options
        );

        console.log('Generation completed successfully!');
        process.exit(0);  // Explicitly exit after successful completion
    } catch (e) {
        console.error('Error during generation:', e);
        process.exit(1);
    }

})().catch((e: any) => {
    console.error('Fatal error:', e);
    process.exit(1);
});

// execute generate command
export async function executeGenerateAsync(
    conn: string,
    tables: string[] = [],
    schema: string | null = null,
    options: CliOptions
): Promise<void> {
    let db: Database = getDatabase(conn);

    try {
        if (!schema) {
            schema = db.getDefaultSchema()
        }

        // if -t is not provided, get all tables from the schema
        if (tables.length === 0) {
            tables = await db.getSchemaTables(schema)
        }

        await generateAndWriteModels(
            db,
            tables,
            schema as string,
            options);

        await generateAndWriteDaos(
            db,
            tables,
            schema as string,
            options
        );
    } finally {
        // Ensure database connection is closed
        await db.close();
    }
}
