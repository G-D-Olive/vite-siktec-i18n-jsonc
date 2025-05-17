"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nJsonPlugin = i18nJsonPlugin;
const utils_1 = require("./utils");
function i18nJsonPlugin(options = {}) {
    const inputDir = options.inputDir || 'src/i18n';
    const outputDir = options.outputDir || 'public/locales';
    return {
        name: 'vite-siktec-i18n-jsonc',
        enforce: 'pre',
        config() {
        },
        async buildStart() {
            await (0, utils_1.processI18nFile)(inputDir, outputDir);
        }
    };
}
exports.default = i18nJsonPlugin;
