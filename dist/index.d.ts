import { Plugin } from 'vite';
export interface I18nPluginOptions {
    inputPath?: string;
    outputDir?: string;
    hotUpdate?: boolean;
    debug?: boolean;
}
export declare function i18nJsonPlugin(options?: I18nPluginOptions): Plugin;
export default i18nJsonPlugin;
