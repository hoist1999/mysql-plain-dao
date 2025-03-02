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

import { Command } from 'commander';
import type { CliOptions, GenerateType } from './Types.js';
import { executeGenerateAsync } from './generate.js';

const program = new Command();

(async () => {
    program
        .name('mysql-plain-dao')
        .description('Generate TypeScript models and DAO from MySQL database tables')
        .version('1.0.0'); // You might want to import this from package.json

    program
        .requiredOption(
            '-c, --conn <connection>',
            'Database connection string (MySQL)'
        )
        .option(
            '-t, --table <tables...>',
            'table name(s) to generate interfaces for'
        )
        .requiredOption(
            '-o, --output <dir>',
            'output directory for generated files'
        )
        .option(
            '-g, --generate <type>',
            'generation type (model, dao, or all)',
            'all'
        )
        .option(
            '--no-header',
            'skip writing file header comment'
        )
        .option(
            '--model-dir <dir>',
            'output directory for model files (overrides -o for models)'
        )
        .option(
            '--dao-dir <dir>',
            'output directory for DAO files (overrides -o for DAOs)'
        );

    program.addHelpText('after', `
Example:
  $ mysql-plain-dao -c mysql://user:pass@localhost:3306/dbname -t users -o ./src/dao/

Please visit online documentation for more usage examples:
https://github.com/hoist1999/mysql-plain-dao`);

    program.parse();

    const options = program.opts();

    try {
        // Validate generate type
        if (options.generate && !['model', 'dao', 'all'].includes(options.generate)) {
            throw new Error('Generate type must be one of: model, dao, all');
        }

        const cliOptions: CliOptions = {
            writeHeader: options.header !== false,
            generateType: options.generate as GenerateType,
            outputDir: options.output,
            modelDir: options.modelDir || '',
            daoDir: options.daoDir || '',
        };

        await executeGenerateAsync(
            options.conn,
            options.table,
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
