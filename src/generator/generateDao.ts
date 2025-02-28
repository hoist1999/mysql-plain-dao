import fs from 'fs'
import path from 'path'
import { formatTypeScript } from './generateModel'
import { CliOptions, Database } from './Types'
import { formatNameWithCase } from './common'

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

            const modelName = formatNameWithCase(table)
            const fileName = `${modelName}Dao.ts`

            // Use daoDir if specified, otherwise use outputDir
            const outputDir = options.daoDir || options.outputDir
            if (!outputDir) {
                throw new Error('No output directory specified for DAO generation')
            }
            const outputPath = `${outputDir}/${fileName}`

            // Ensure output directory exists
            fs.mkdirSync(outputDir, { recursive: true })

            console.log(`Writing DAO file: ${outputPath}`)
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
    output += `import { ${baseClass} } from 'mysql-plain-dao';\n`

    // Calculate model name with proper PascalCase
    const modelName = formatNameWithCase(table)
    const modelFileName = `${table}Model` // Keep filename casing unchanged

    // Calculate relative path from daoDir to modelDir
    const daoDir = options.daoDir || options.outputDir
    const modelDir = options.modelDir || options.outputDir

    // Calculate relative import path
    let importPath = ''
    if (daoDir === modelDir) {
        // If in same directory, import from same folder
        importPath = `./${modelFileName}`
    } else {
        // Calculate relative path between directories
        const relativePath = path.relative(daoDir!, modelDir!)
        importPath = `${relativePath}/${modelFileName}`
        // Ensure path starts with ./ or ../
        if (!importPath.startsWith('.')) {
            importPath = `./${importPath}`
        }
    }

    output += `import { ${modelName} } from '${importPath}';\n\n`

    // Generate DAO class with PascalCase name
    output += `export class ${modelName}Dao extends ${baseClass}<${modelName}> {\n`
    output += `    constructor() {\n`
    output += `        super({\n`
    output += `            table_name: '${table}',\n`
    output += `        });\n`
    output += `    }\n`
    output += `}\n`

    return output
}
