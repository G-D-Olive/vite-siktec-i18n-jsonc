import {
    describe, it, expect, 
    beforeEach, afterEach, 
    beforeAll, afterAll 
} from 'vitest';
import fs from 'fs';
import path from 'path';
import {
    processI18nFile, 
    processI18nFiles
} from '../src/utils';

const inputDirSingle = 'tests/mock/single';
const outputDirSingle = 'tests/mock/single/output';
const inputDirMulti = 'tests/mock/multi';
const outputDirMulti = 'tests/mock/multi/output';

beforeAll(() => {
    fs.rmSync(outputDirSingle, { recursive: true, force: true });
    fs.rmSync(outputDirMulti, { recursive: true, force: true });
});

afterAll(() => {
    fs.rmSync(outputDirSingle, { recursive: true, force: true });
    fs.rmSync(outputDirMulti, { recursive: true, force: true });
});

describe(
    'processI18nFile() - Single file',
    () => {
        const theInputFile = path.join(inputDirSingle, 'language.jsonc');
        const outputEn = path.join(outputDirSingle, 'en', 'one.json');
        const outputHe = path.join(outputDirSingle, 'he', 'one.json');
        const outputFr = path.join(outputDirSingle, 'fr', 'one.json');
        const warningFile = path.join(outputDirSingle, 'language.warnings.log');

        it('splits valid JSON into separate namespace files', async () => {
            await processI18nFile(theInputFile, outputDirSingle);
            expect(fs.existsSync(outputEn)).toBe(true);
            expect(fs.existsSync(outputHe)).toBe(true);
            expect(fs.existsSync(outputFr)).toBe(true);
            expect(fs.existsSync(warningFile)).toBe(true);
        });

        it('Validate generated files content', async () => {
            // English
            const contentEn = fs.readFileSync(outputEn, 'utf-8');
            const expectedEn = {
                "key": "one value",
                "key2": "one value2",
                "key3": {
                    "nested" : "one value3"
                }
            };
            expect(JSON.parse(contentEn)).toEqual(expectedEn);

            // Hebrew
            const contentHe = fs.readFileSync(outputHe, 'utf-8');
            const expectedHe = {
                "key": "one ערך",
                "key2": "one ערך2",
                "key3": {
                    "nested" : "one ערך3"
                }
            };
            expect(JSON.parse(contentHe)).toEqual(expectedHe);

            // French
            const contentFr = fs.readFileSync(outputFr, 'utf-8');
            const expectedFr = {
                "key2": "one valeur3",
                "key3": {
                    "nested" : "one valeur3"
                }
            };
            expect(JSON.parse(contentFr)).toEqual(expectedFr);
        });

        it('Warning log file', async () => {

            // Exists:
            expect(fs.existsSync(warningFile)).toBe(true);

            // Read the content of the file:
            const content = fs.readFileSync(warningFile, 'utf-8');

            // Should have  1 line:
            const lines = content.split('\n');
            expect(lines.length).toBe(2);

            // each line starts with "Missing":
            lines.forEach(line => {
                expect(line.startsWith('Missing') || line.startsWith('--- Warnings')).toBe(true);
            });

            // each line should have "fr" in it:
            expect(lines[1].includes('"fr"')).toBe(true);
        });
    }
);

describe(
    'processI18nFiles() - Multi file',
    () => {
        const theInputDir = inputDirMulti;
        const validateGeneratedFiles = [
            path.join(outputDirMulti, 'en', 'one.json'),
            path.join(outputDirMulti, 'he', 'one.json'),
            path.join(outputDirMulti, 'fr', 'one.json'),
            path.join(outputDirMulti, 'en', 'three.json'),
            path.join(outputDirMulti, 'he', 'three.json'),
            path.join(outputDirMulti, 'fr', 'three.json'),
            path.join(outputDirMulti, 'first.warnings.log'),
            path.join(outputDirMulti, 'second.warnings.log')
        ];

        it('splits valid JSON into separate namespace files', async () => {
            await processI18nFiles(theInputDir, outputDirMulti);
            for (const file of validateGeneratedFiles) {
                expect(fs.existsSync(file)).toBe(true);
            }
        });
    }
);