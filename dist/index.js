"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nJsonPlugin = i18nJsonPlugin;
const utils_1 = require("./utils");
function i18nJsonPlugin(options = {}) {
    const inputDir = options.inputDir || 'src/i18n';
    const outputDir = options.outputDir || 'public/locales';
    let singleFile = true;
    // if its a file wrap it in an array:
    if (inputDir.endsWith('.jsonc') || inputDir.endsWith('.json')) {
        singleFile = true;
    }
    // Return the plugin object:
    return {
        name: 'vite-siktec-i18n-jsonc',
        enforce: 'pre',
        config() {
        },
        async buildStart() {
            if (singleFile) {
                await (0, utils_1.processI18nFile)(inputDir, outputDir);
            }
            else {
                await (0, utils_1.processI18nFiles)(inputDir, outputDir);
            }
        }
    };
}
exports.default = i18nJsonPlugin;
