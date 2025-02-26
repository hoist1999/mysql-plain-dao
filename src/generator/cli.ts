#! /usr/bin/env node
/**
 * Command Line Interface for Database Model Generator
 * 
 * This tool automatically generates TypeScript models/interfaces from existing MySQL/PostgreSQL database tables.
 * It helps maintain type safety by creating type definitions that match your database schema.
 * 
 * Example usage:
 * MySQL:     schemats generate -c mysql://user:pass@localhost:3306/dbname -t users -o src/models/users.ts
 * PostgreSQL: schemats generate -c postgres://user:pass@localhost:5432/dbname -t users -o src/models/users.ts
 * 
 * Created by xiamx on 2016-08-10.
 * Enhanced with MySQL and PostgreSQL support.
 */

import chalk from 'chalk'
import * as fs from 'fs'
import terminalLink from 'terminal-link'
import * as yargs from 'yargs'
import { typescriptOfSchema } from './index'


(async () => {

    let argv = await yargs
        .locale('en')
        .usage(`
${chalk.bold('Generate TypeScript models from MySQL/PostgreSQL database tables.')}

Usage: ${chalk.cyan('$0')} ${chalk.green('<command>')} ${chalk.yellow('[options]')}

Please visit ${terminalLink('documentation', 'https://github.com/hoist1999/mysql-plain-dao')} for usage examples.

${chalk.bold('This tool helps you:')}
    - Generate TypeScript interfaces from existing database tables
`)
        .global('config')
        .default('config', 'schemats.json')
        .config()
        .env('SCHEMATS')
        .demandCommand(1, 'You need at least one command before moving on')
        .strict()

        // subcommand: generate
        .command({
            command: "generate",
            describe: 'generate TypeScript definitions from database schema',
            builder: (yargs) => {
                return yargs
                    // database connection string: required
                    .demand('c')
                    .alias('c', 'conn')
                    .nargs('c', 1)
                    .describe('c', 'Database connection string (MySQL or PostgreSQL)')

                    // table name(s): required
                    .alias('t', 'table')
                    .nargs('t', 1)
                    .describe('t', 'table name(s) to generate interfaces for')

                    // schema name: optional    
                    .alias('s', 'schema')
                    .nargs('s', 1)
                    .describe('s', 'database schema name')

                    // camelCase: optional
                    .alias('C', 'camelCase')
                    .describe('C', 'convert column names to camelCase')

                    // skip writing file header comment: optional
                    .describe('noHeader', 'skip writing file header comment')

                    // output file path: required
                    .demand('o')
                    .nargs('o', 1)
                    .alias('o', 'output')
                    .describe('o', 'output TypeScript file path')
            },
            handler: async (argv) => {
                try {
                    if (!Array.isArray(argv)) {
                        if (!argv.table) {
                            argv.table = []
                        } else {
                            argv.table = [argv.table]
                        }
                    }

                    let formattedOutput = await typescriptOfSchema(
                        argv.conn as string,
                        argv.table as string[],
                        argv.schema as string,
                        { camelCase: argv.camelCase as boolean, writeHeader: !argv.noHeader })
                    fs.writeFileSync(argv.output as fs.PathOrFileDescriptor, formattedOutput)

                } catch (e) {
                    console.error(e)
                    process.exit(1)
                }
            }
        })
        // help: optional
        .help('h')
        .alias('h', 'help')
        .showHelpOnFail(true, 'Specify --help for available options')
        .recommendCommands()
        .argv;

})().catch((e: any) => {
    console.warn(e)
    process.exit(1)
})
