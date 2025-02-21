import pluralize from 'pluralize';
import SqlString from 'sqlstring';
import { trim } from 'lodash';

/** 关键字转化为SQL条件 */
export function keywordToCondition(field_name: string, keyword_text: string): string {
    let keyword_list = keyword_text.toLowerCase().trim().split(/\s+/);
    const IGNORE_PHRASE = ['of', 'with', 'on', 'for', 'in'];

    let sql = ` 1 = 1 `;

    // 	AND (keyword REGEXP ? OR keyword REGEXP ?) AND (keyword REGEXP ? OR keyword REGEXP ?)
    for (let keyword of keyword_list) {
        if (IGNORE_PHRASE.includes(keyword)) {
            //忽略掉on, with, of等副词
            continue;
        }

        //MySql中单词的边界 [[:<:]]单词[[:>:]]
        //参考：https://stackoverflow.com/questions/18901704/mysql-regexp-word-boundaries-and-double-quotes

        let keyword_singular = trim(SqlString.escape(pluralize.singular(keyword)), "'");
        let keyword_plural = trim(SqlString.escape(pluralize.plural(keyword)), "'");

        if (keyword_singular == keyword_plural) {
            //这个词的单数和复数一样
            sql += `AND ( ${SqlString.escapeId(field_name)} 
						REGEXP '[[:<:]]${keyword_singular}[[:>:]]'
					)`;
        }
        else {
            //单数或者复数
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
 * 关键字列表转化为SQL条件
 * @param field_name SQL字段名，例如keyword或者R.keyword等等
 * @param keyword_text_list 关键字列表，可以直接从界面中传入的分行的多个关键字，或者关键字数组
 * @returns 
 */
export function keywordListToCondition(field_name: string, keyword_text_list: string | string[]): string {
    const keyword_array = (typeof keyword_text_list === "string")
        ? keyword_text_list //如果是字符串型的，那么按行分割后转为数组
            ? keyword_text_list.split("\n").filter(k => k !== '')
            : []
        : keyword_text_list; //如果是数组型的，直接用

    return keyword_array
        .map(keyword_text => `${keywordToCondition(field_name, keyword_text)}`)
        .join("\n");
}
