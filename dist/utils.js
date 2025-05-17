"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processI18nFiles = processI18nFiles;
exports.processI18nFile = processI18nFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonc_parser_1 = require("jsonc-parser");
async function processI18nFiles(inputDir, outputDir) {
    // Check if the input directory exists:
    const files = fs_1.default.readdirSync(inputDir).filter(f => f.endsWith('.json') || f.endsWith('.jsonc'));
    // console.log(`Processing ${files.length} files in ${inputDir}`);
    // console.log(`files:`, files);
    for (const file of files) {
        // if file is json or jsonc:
        if (file.endsWith('.json') || file.endsWith('.jsonc')) {
            // use the processI18nFile function to process each file
            const inputFile = path_1.default.join(inputDir, file);
            // console.log(`Processing file: ${file}`);
            await processI18nFile(inputFile, outputDir, true);
        }
    }
}
function processI18nFile(inputFile, outputDir, multi = false) {
    return new Promise((resolve, reject) => {
        // Read the input file:
        const content = fs_1.default.readFileSync(inputFile, 'utf-8');
        // Parse the JSON content:
        let jsonData;
        try {
            jsonData = inputFile.endsWith('.jsonc') ? (0, jsonc_parser_1.parse)(content) : JSON.parse(content);
        }
        catch (error) {
            console.error(`Failed to parse ${inputFile}:`, error);
            reject(error);
            return;
        }
        // Create the output directory if it doesn't exist:
        fs_1.default.mkdirSync(outputDir, { recursive: true });
        // First level of the JSON structure are the file namespaces extract the first level keys and create a directory for each:
        let files = [];
        let langs = [];
        let keys = Object.keys(jsonData);
        keys.forEach((key) => {
            const fileName = `${key}.json`;
            const languages = getNestedLaguagesCode(jsonData[key]);
            languages.forEach((lang) => {
                files.push(path_1.default.join(outputDir, lang, fileName));
            });
            langs.push(...languages);
        });
        // remove duplicates from langs:
        langs = [...new Set(langs)];
        // remove duplicates from files:
        files = [...new Set(files)];
        // Create the laguages directories if they don't exist:
        langs.forEach((lang) => {
            const langDir = path_1.default.join(outputDir, lang);
            fs_1.default.mkdirSync(langDir, { recursive: true });
        });
        // Create empty files with a s '{}' content: 
        files.forEach((file) => {
            if (!fs_1.default.existsSync(file)) {
                fs_1.default.writeFileSync(file, '{}', 'utf-8');
            }
        });
        // Flatten the JSON object to paths:
        const flattened = flattenObjectToPaths(jsonData);
        // console.log(`langs:`, langs);
        // console.log(`keys:`, keys);
        // console.log(`files:`, files);
        // console.log(`Flattened JSON:`, flattened);
        // Process the flattened object and create the structure:
        let structure = {};
        let toValidate = {};
        for (const key of keys) {
            for (const lang of langs) {
                // Get ready to store the values:
                if (structure[lang] === undefined) {
                    structure[lang] = {};
                }
                // Get all the entries from the flattened object that start with the current key and ends with the current lang:
                const entries = Object.entries(flattened).filter(([k]) => k.startsWith(`${key}.`) && k.endsWith(`.${lang}`));
                // Push them to the values array:
                entries.forEach(([k, v]) => {
                    const parts = k.split('.');
                    // remove the last part of the the path : its the lang:
                    parts.pop();
                    // Set the value in the represent object:
                    objectFromDotNotationPath(structure[lang], parts.join('.'), v);
                    // Save for validation:
                    const onlyPath = parts.join('.');
                    if (toValidate[onlyPath] === undefined) {
                        toValidate[onlyPath] = [];
                    }
                    toValidate[onlyPath].push(lang);
                });
            }
        }
        // console.log(`structure:`, JSON.stringify(structure, null, 2));
        // console.log(`validate:`, JSON.stringify(toValidate, null, 2));
        // Validate the object:
        const warnings = validateObject(toValidate, langs);
        // console.log(`Warnings:`, warnings);
        // Write the structure to the files:
        for (const [lang, struct] of Object.entries(structure)) {
            for (const [file, values] of Object.entries(struct)) {
                const filePath = path_1.default.join(outputDir, lang, `${file}.json`);
                const fileContent = JSON.stringify(values, null, 4);
                // Create the the file if it doesn't exist truncate it if it does and then write the content:
                if (!fs_1.default.existsSync(filePath)) {
                    fs_1.default.writeFileSync(filePath, fileContent, 'utf-8');
                }
                else {
                    // Truncate the file and write the content:
                    fs_1.default.truncateSync(filePath, 0);
                    fs_1.default.writeFileSync(filePath, fileContent, 'utf-8');
                }
            }
        }
        // write a warning file with the warnings:
        const file = path_1.default.basename(inputFile, path_1.default.extname(inputFile));
        const warningFile = path_1.default.join(outputDir, `${file}.warnings.log`);
        if (warnings.length > 0) {
            fs_1.default.writeFileSync(warningFile, [`--- Warnings for ${inputFile} ---`, ...warnings].join('\n'), 'utf-8');
        }
        else {
            // If no warnings remove the file:
            if (fs_1.default.existsSync(warningFile) && !multi) {
                fs_1.default.unlinkSync(warningFile);
            }
        }
        resolve();
    });
}
function objectFromDotNotationPath(obj, // The source object
path, // 'key1.key2.key3'
value // The value to set
) {
    const keys = path.split('.'); // Split the path into keys
    let current = obj; // Start with the source object
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
            current[key] = {}; // Create an empty object if it doesn't exist
        }
        current = current[key]; // Move deeper into the object
    }
    current[keys[keys.length - 1]] = value; // Set the value at the last key
}
function getNestedLaguagesCode(obj) {
    const laguages = [];
    // Iterate over the object keys recursively; only the deepest level keys are actually languages:
    function iterate(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                iterate(obj[key]);
            }
            else {
                laguages.push(key);
            }
        }
    }
    iterate(obj);
    return laguages;
}
function flattenObjectToPaths(obj, parentKey = '', result = {}) {
    for (const key in obj) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            flattenObjectToPaths(obj[key], newKey, result);
        }
        else {
            result[newKey] = obj[key];
        }
    }
    return result;
}
function validateObject(obj, langs) {
    const errors = [];
    for (const lang of langs) {
        for (const key in obj) {
            if (!obj[key].includes(lang)) {
                errors.push(`Missing language "${lang}" for key "${key}"`);
            }
        }
    }
    return errors;
}
