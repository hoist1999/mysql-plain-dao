import fs from 'fs'
import { buildHeader, formatTypeScript } from './generateModel'
import { CliOptions, Database } from './Types'

export async function generateAndWriteDaos(
    db: Database,
    tables: string[],
    schema: string,
    options: CliOptions,
): Promise<void> {
    if (options.generateType === 'dao' || options.generateType === 'all') {
        for (const table of tables) {
            const daoContent = await generateDao(db, table, schema, options)
            const formattedOutput = await formatTypeScript(daoContent)

            const modelName = table.charAt(0).toUpperCase() + table.slice(1)
            const outputPath = `${options.daoDir}/${modelName}Dao.ts`

            if (options.daoDir) {
                fs.mkdirSync(options.daoDir, { recursive: true });
            }
            fs.writeFileSync(outputPath, formattedOutput)
        }
    }
}

async function generateDao(
    db: Database,
    table: string,
    schema: string,
    options: CliOptions
): Promise<string> {
    let output = '/* tslint:disable */\n\n'

    // Get primary key info
    const primaryKey = await db.getPrimaryKey(schema, table)
    const isUUID = primaryKey?.dataType?.toLowerCase().includes('uuid')
    const baseClass = isUUID ? 'BaseDAOWithUUID' : 'BaseDAO'

    // Add imports
    output += `import { ${baseClass} } from '../dao/${baseClass}';\n`
    const modelName = table.charAt(0).toUpperCase() + table.slice(1)
    output += `import { ${modelName} } from '../models/${modelName}';\n\n`

    // Generate DAO class
    output += `export class ${modelName}Dao extends ${baseClass}<${modelName}> {\n`
    output += `    constructor() {\n`
    output += `        super({\n`
    output += `            table_name: '${table}',\n`
    output += `        });\n`
    output += `    }\n`
    output += `}\n`

    return output
}
