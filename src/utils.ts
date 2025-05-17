import fs from 'fs';
import path from 'path';
import { parse } from 'jsonc-parser';

export async function processI18nFiles(
    inputDir: string,
    outputDir: string
): Promise<void> {
    // Check if the input directory exists:
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json') || f.endsWith('.jsonc'));
    console.log(`Processing ${files.length} files in ${inputDir}`);
    console.log(`files:`, files);
    for (const file of files) {
        // if file is json or jsonc:
        if (file.endsWith('.json') || file.endsWith('.jsonc')) {
            // use the processI18nFile function to process each file
            const inputFile = path.join(inputDir, file);
            console.log(`Processing file: ${file}`);
            await processI18nFile(inputFile, outputDir, true);
        }
    }
}

export function processI18nFile(
  inputFile: string,
  outputDir: string,
  multi: boolean = false
): Promise<void> {
    return new Promise((resolve, reject) => {

        // Read the input file:
        const content = fs.readFileSync(inputFile, 'utf-8');
        
        // Parse the JSON content:
        let jsonData: Record<string, any>;
        try {
            jsonData = inputFile.endsWith('.jsonc') ? parse(content) : JSON.parse(content);
        } catch (error) {
            console.error(`Failed to parse ${inputFile}:`, error);
            reject(error);
            return;
        }
        
        // Create the output directory if it doesn't exist:
        fs.mkdirSync(outputDir, { recursive: true });
        
        // First level of the JSON structure are the file namespaces extract the first level keys and create a directory for each:
        let files : string[] = [];
        let langs : string[] = [];
        let keys  : string[] = Object.keys(jsonData);

        keys.forEach((key) => {
            const fileName = `${key}.json`;
            const languages = getNestedLaguagesCode(jsonData[key]);
            languages.forEach((lang) => {
                files.push(path.join(outputDir, lang, fileName));
            });
            langs.push(...languages);
        });

        // remove duplicates from langs:
        langs = [...new Set(langs)];

        // remove duplicates from files:
        files = [...new Set(files)];

        // Create the laguages directories if they don't exist:
        langs.forEach((lang) => {
            const langDir = path.join(outputDir, lang);
            fs.mkdirSync(langDir, { recursive: true });
        });

        // Create empty files with a s '{}' content: 
        files.forEach((file) => {
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, '{}', 'utf-8');
            }
        });

        // Flatten the JSON object to paths:
        const flattened = flattenObjectToPaths(jsonData);

        // console.log(`langs:`, langs);
        // console.log(`keys:`, keys);
        // console.log(`files:`, files);
        // console.log(`Flattened JSON:`, flattened);
        
        // Process the flattened object and create the structure:
        let structure : Record<string, any> = {};
        let toValidate : Record<string, string[]> = {};
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
                const filePath = path.join(outputDir, lang, `${file}.json`);
                const fileContent = JSON.stringify(values, null, 4);
                // Create the the file if it doesn't exist truncate it if it does and then write the content:
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, fileContent, 'utf-8');
                } else {
                    // Truncate the file and write the content:
                    fs.truncateSync(filePath, 0);
                    fs.writeFileSync(filePath, fileContent, 'utf-8');
                }
            }
        }

        // write a warning file with the warnings:
        const file = path.basename(inputFile, path.extname(inputFile));
        const warningFile = path.join(outputDir, `${file}.warnings.log`);
        if (warnings.length > 0) {
            fs.writeFileSync(
                warningFile, 
                [`--- Warnings for ${inputFile} ---`, ...warnings].join('\n'), 
                'utf-8'
            );
        } else {
            // If no warnings remove the file:
            if (fs.existsSync(warningFile) && !multi) {
                fs.unlinkSync(warningFile);
            }
        }
        resolve();
    });
}

function objectFromDotNotationPath(
    obj: Record<string, any>, // The source object
    path: string, // 'key1.key2.key3'
    value: any // The value to set
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

function getNestedLaguagesCode(obj: Record<string, any>) {
    const laguages: string[] = [];
    // Iterate over the object keys recursively; only the deepest level keys are actually languages:
    function iterate(obj: Record<string, any>) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                iterate(obj[key]);
            } else {
                laguages.push(key);
            }
        }
    }
    iterate(obj);
    return laguages;
}

function flattenObjectToPaths(obj: Record<string, any>, parentKey = '', result: Record<string, any> = {}): Record<string, any> {
    for (const key in obj) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            flattenObjectToPaths(obj[key], newKey, result);
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

function validateObject(obj: Record<string, string[]>, langs: string[]): string[] {
    const errors: string[] = [];
    for (const lang of langs) {
        for (const key in obj) {
            if (!obj[key].includes(lang)) {
                errors.push(`Missing language "${lang}" for key "${key}"`);
            }
        }
    }
    return errors;
}