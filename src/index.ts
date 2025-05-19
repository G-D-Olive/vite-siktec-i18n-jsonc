import { Plugin } from 'vite';
import { processI18nFile, processI18nFiles } from './utils';
import path from 'path';

export interface I18nPluginOptions {
  inputPath?: string;
  outputDir?: string;
  hotUpdate?: boolean;
  debug?: boolean;
}

export function i18nJsonPlugin(options: I18nPluginOptions = {}): Plugin {
    const inputPath = options.inputPath || 'src/i18n';
    const outputDir = options.outputDir || 'public/locales';
    const hotUpdate = options.hotUpdate || false;
    const debug = options.debug || false;
    const inputDir = inputPath.endsWith('.json') || inputPath.endsWith('.jsonc') ? path.dirname(inputPath) : inputPath;
    let singleFile : boolean = false;
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
                if (debug) { console.log('i18n Processing single file:', inputPath); }
                await processI18nFile(inputPath, outputDir);
            } else {
                if (debug) { console.log('i18n Processing directory:', inputDir); }
                await processI18nFiles(inputPath, outputDir);
            }
        },
        async handleHotUpdate(ctx) {

            if (!hotUpdate) {
                if (debug) { console.log('i18n Hot update disabled'); }
                return;
            }

            const changedDir = path.dirname(ctx.file);
            const changedFile = ctx.file;

            // is inputDir in the file path:
            if (singleFile && changedFile.endsWith(inputPath) || !singleFile && changedDir.endsWith(inputDir)) {
                if (singleFile) {
                    if (debug) { console.log('i18n file changed:', changedFile); }
                    await processI18nFile(inputPath, outputDir);
                } else {
                    if (debug) { console.log('i18n dir changed:', changedDir); }
                    await processI18nFiles(inputPath, outputDir);
                }
            } else {
                return;
            }
        },
        configureServer(server) {
            // the path of outputDir use the config from vite.config.ts
            const theAbsPath = path.resolve(server.config.root, outputDir);
            // Replace with your actual output directory
            server.watcher.unwatch(`${theAbsPath}/**`);
        }
    };
}

export default i18nJsonPlugin;