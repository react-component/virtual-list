import { defineConfig } from 'dumi';
import path from 'path';

const basePath = process.env.GH_PAGES ? '/virtual-list/' : '/';
const publicPath = process.env.GH_PAGES ? '/virtual-list/' : '/';

export default defineConfig({
  alias: {
    '@rc-component/virtual-list$': path.resolve('src'),
    '@rc-component/virtual-list/es': path.resolve('src'),
    '@rc-component/virtual-list/es/*': path.resolve('src'),
  },
  mfsu: false,
  favicons: ['https://avatars0.githubusercontent.com/u/9441414?s=200&v=4'],
  themeConfig: {
    name: 'Virtual List',
    logo: 'https://avatars0.githubusercontent.com/u/9441414?s=200&v=4',
  },
  outputPath: 'docs-dist',
  base: basePath,
  publicPath,
});
