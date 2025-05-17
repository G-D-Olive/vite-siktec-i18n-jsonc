import { Plugin } from 'vite';
export interface I18nPluginOptions {
    inputPath?: string;
    outputDir?: string;
}
export declare function i18nJsonPlugin(options?: I18nPluginOptions): Plugin;
export default i18nJsonPlugin;
