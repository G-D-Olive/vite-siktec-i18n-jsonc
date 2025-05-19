"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nJsonPlugin = i18nJsonPlugin;
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
function i18nJsonPlugin(options = {}) {
    const inputPath = options.inputPath || 'src/i18n';
    const outputDir = options.outputDir || 'public/locales';
    const hotUpdate = options.hotUpdate || false;
    const debug = options.debug || false;
    const inputDir = inputPath.endsWith('.json') || inputPath.endsWith('.jsonc') ? path_1.default.dirname(inputPath) : inputPath;
    let singleFile = false;
    // if its a file wrap it in an array:
    if (inputPath.endsWith('.jsonc') || inputPath.endsWith('.json')) {
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
                if (debug) {
                    console.log('i18n Processing single file:', inputPath);
                }
                await (0, utils_1.processI18nFile)(inputPath, outputDir);
            }
            else {
                if (debug) {
                    console.log('i18n Processing directory:', inputDir);
                }
                await (0, utils_1.processI18nFiles)(inputPath, outputDir);
            }
        },
        async handleHotUpdate(ctx) {
            if (!hotUpdate) {
                if (debug) {
                    console.log('i18n Hot update disabled');
                }
                return;
            }
            const changedDir = path_1.default.dirname(ctx.file);
            const changedFile = ctx.file;
            // is inputDir in the file path:
            if (singleFile && changedFile.endsWith(inputPath) || !singleFile && changedDir.endsWith(inputDir)) {
                if (singleFile) {
                    if (debug) {
                        console.log('i18n file changed:', changedFile);
                    }
                    await (0, utils_1.processI18nFile)(inputPath, outputDir);
                }
                else {
                    if (debug) {
                        console.log('i18n dir changed:', changedDir);
                    }
                    await (0, utils_1.processI18nFiles)(inputPath, outputDir);
                }
            }
            else {
                return;
            }
        },
        configureServer(server) {
            // the path of outputDir use the config from vite.config.ts
            const theAbsPath = path_1.default.resolve(server.config.root, outputDir);
            // Replace with your actual output directory
            server.watcher.unwatch(`${theAbsPath}/**`);
        }
    };
}
exports.default = i18nJsonPlugin;
