import { Plugin } from 'vite';
import { processI18nFile, processI18nFiles } from './utils';

export interface I18nPluginOptions {
  inputPath?: string;
  outputDir?: string;
}

export function i18nJsonPlugin(options: I18nPluginOptions = {}): Plugin {
    const inputPath = options.inputPath || 'src/i18n';
    const outputDir = options.outputDir || 'public/locales';
    let singleFile : boolean = true;
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
                await processI18nFile(inputPath, outputDir);
            } else {
                await processI18nFiles(inputPath, outputDir);
            }
        }
    };
}

export default i18nJsonPlugin;