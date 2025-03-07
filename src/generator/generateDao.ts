import fs from 'fs'
import path from 'path'
import { toCamelCase } from './common'
import { formatTypeScript } from './generateModel'
import type { CliOptions, Database } from './Types'

/** Determine which base DAO class to use based on table structure */
async function determineBaseClass(
    db: Database,
    schema: string,
    table: string
): Promise<{
    baseClass: 'BaseDao' | 'BaseDaoWithUUID' | 'BaseDaoDoubleID';
    idField?: string;
    uuidField?: string;
}> {
    const tableDefinition = await db.getTableDefinition(table, schema);

    let hasIntegerId = false;
    let hasUuidField = false;
    let idFieldName = 'id';
    let uuidFieldName = 'uuid';

    // 检查整数类型的主键
    const integerIdColumn = Object.entries(tableDefinition).find(([name, def]) =>
        name.toLowerCase() === 'id' &&
        def.isPrimaryKey &&
        ['int', 'bigint', 'integer'].includes(def.udtName.toLowerCase())
    );

    if (integerIdColumn) {
        hasIntegerId = true;
        idFieldName = integerIdColumn[0]; // 使用列名
    }

    // 检查 UUID 字段
    const uuidColumn = Object.entries(tableDefinition).find(([name, def]) => {
        const isStringType = ['char', 'varchar'].includes(def.udtName.toLowerCase());

        return name.toLowerCase() === 'uuid' &&
            isStringType &&
            def.isUnique;
    });

    if (uuidColumn) {
        hasUuidField = true;
        uuidFieldName = uuidColumn[0]; // 使用列名
    }

    // 确定基类
    if (hasIntegerId && hasUuidField) {
        return {
            baseClass: 'BaseDaoDoubleID',
            idField: idFieldName,
            uuidField: uuidFieldName
        };
    } else if (hasUuidField) {
        return {
            baseClass: 'BaseDaoWithUUID',
            uuidField: uuidFieldName
        };
    } else {
        return {
            baseClass: 'BaseDao',
            idField: idFieldName
        };
    }
}

async function generateDao(
    db: Database,
    table: string,
    schema: string,
    options: CliOptions
): Promise<string> {
    let output = '/* tslint:disable */\n\n'

    // Determine which base class to use
    const { baseClass, idField, uuidField } = await determineBaseClass(db, schema, table)

    // Add imports
    output += `import { ${baseClass} } from 'mysql-plain-dao';\n`

    // Calculate model name with proper PascalCase
    const modelName = toCamelCase(table)
    const modelFileName = `${modelName}` // Keep filename casing unchanged

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

    output += `import type { ${modelName} } from '${importPath}';\n\n`

    // Generate DAO class with PascalCase name
    output += `export class ${modelName}Dao extends ${baseClass}<${modelName}> {\n`
    output += `    constructor() {\n`
    output += `        super({\n`
    output += `            table_name: '${table}',\n`

    // Add id_field and uuid_field if needed
    if (idField && idField !== 'id') {
        output += `            id_field: '${idField}',\n`
    }
    if (uuidField && uuidField !== 'uuid') {
        output += `            uuid_field: '${uuidField}',\n`
    }

    output += `        });\n`
    output += `    }\n`
    output += `    \n`
    output += `    // You can add your own methods below\n`
    output += `}\n`

    return output
}

export async function generateAndWriteDaos(
    db: Database,
    tables: string[],
    schema: string,
    options: CliOptions,
): Promise<void> {
    if (options.generateType === 'dao' || options.generateType === 'all') {
        for (const table of tables) {
            const modelName = toCamelCase(table)
            const fileName = `${modelName}Dao.ts`

            // Use daoDir if specified, otherwise use outputDir
            const outputDir = options.daoDir || options.outputDir
            if (!outputDir) {
                throw new Error('No output directory specified for DAO generation')
            }
            const outputPath = `${outputDir}/${fileName}`

            // Check if file already exists
            if (fs.existsSync(outputPath)) {
                console.log(`⏭️  Skipping ${fileName} - file already exists`)
                continue
            }

            const daoContent = await generateDao(db, table, schema, options)
            const formattedOutput = await formatTypeScript(daoContent)

            // Ensure output directory exists
            fs.mkdirSync(outputDir, { recursive: true })
            fs.writeFileSync(outputPath, formattedOutput)
            console.log(`✅ Generated ${fileName}`)
        }
    }
}
