import pluralize from 'pluralize';
import SqlString from 'sqlstring';
import { trim } from 'lodash';

/** Convert keyword to SQL condition */
export function keywordToCondition(field_name: string, keyword_text: string): string {
    let keyword_list = keyword_text.toLowerCase().trim().split(/\s+/);
    const IGNORE_PHRASE = ['of', 'with', 'on', 'for', 'in'];

    let sql = ` 1 = 1 `;

    // AND (keyword REGEXP ? OR keyword REGEXP ?) AND (keyword REGEXP ? OR keyword REGEXP ?)
    for (let keyword of keyword_list) {
        if (IGNORE_PHRASE.includes(keyword)) {
            // Skip prepositions like 'on', 'with', 'of'
            continue;
        }

        // Word boundaries in MySQL: [[:<:]]word[[:>:]]
        // Reference: https://stackoverflow.com/questions/18901704/mysql-regexp-word-boundaries-and-double-quotes

        let keyword_singular = trim(SqlString.escape(pluralize.singular(keyword)), "'");
        let keyword_plural = trim(SqlString.escape(pluralize.plural(keyword)), "'");

        if (keyword_singular == keyword_plural) {
            // Same form for singular and plural
            sql += `AND ( ${SqlString.escapeId(field_name)} 
                        REGEXP '[[:<:]]${keyword_singular}[[:>:]]'
                    )`;
        }
        else {
            // Match either singular or plural form
            sql += `AND ( 
                    ${SqlString.escapeId(field_name)} 
                    REGEXP '[[:<:]]${keyword_singular}[[:>:]]'
                    OR
                    ${SqlString.escapeId(field_name)} 
                    REGEXP '[[:<:]]${keyword_plural}[[:>:]]'
                )`;
        }
    }

    return sql;
}

/**
 * Convert keyword list to SQL condition
 * @param field_name SQL field name, e.g., 'keyword' or 'R.keyword'
 * @param keyword_text_list Keywords list, can be newline-separated text from UI or array of keywords
 * @returns SQL condition string
 */
export function keywordListToCondition(field_name: string, keyword_text_list: string | string[]): string {
    const keyword_array = (typeof keyword_text_list === "string")
        ? keyword_text_list // If string, split by newlines and filter empty lines
            ? keyword_text_list.split("\n").filter(k => k !== '')
            : []
        : keyword_text_list; // If array, use directly

    return keyword_array
        .map(keyword_text => `${keywordToCondition(field_name, keyword_text)}`)
        .join("\n");
}
