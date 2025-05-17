import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { processI18nFile } from '../src/utils';

const inputDir = 'tests/mock/input';
const outputDir = 'tests/mock/output';

beforeAll(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
});

afterAll(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
});

describe('processI18nFiles()', () => {

    const theInputFile = path.join(inputDir, 'language.jsonc');
    const outputEn = path.join(outputDir, 'en', 'one.json');
    const outputHe = path.join(outputDir, 'he', 'one.json');
    const outputFr = path.join(outputDir, 'fr', 'one.json');
    const warningFile = path.join(outputDir, 'warnings.log');

    it('splits valid JSON into separate namespace files', async () => {


        await processI18nFile(theInputFile, outputDir);

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
        expect(lines.length).toBe(1);

        // each line starts with "Missing":
        lines.forEach(line => {
            expect(line.startsWith('Missing')).toBe(true);
        });

        // each line should have "fr" in it:
        lines.forEach(line => {
            expect(line.includes('"fr"')).toBe(true);
        });
    });
});