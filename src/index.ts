import { Plugin } from 'vite';
import { processI18nFile } from './utils';

export interface I18nPluginOptions {
  inputDir?: string;
  outputDir?: string;
}

export function i18nJsonPlugin(options: I18nPluginOptions = {}): Plugin {
  const inputDir = options.inputDir || 'src/i18n';
  const outputDir = options.outputDir || 'public/locales';
  return {
    name: 'vite-siktec-i18n-jsonc',
    enforce: 'pre',
    config() {
    },
    async buildStart() {
      await processI18nFile(inputDir, outputDir);
    }
  };
}

export default i18nJsonPlugin;