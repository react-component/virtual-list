// more config: https://d.umijs.org/config
import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'rc-virtual-list',
  favicon:
    'https://avatars0.githubusercontent.com/u/9441414?s=200&v=4',
  logo:
    'https://avatars0.githubusercontent.com/u/9441414?s=200&v=4',
  outputPath: '.doc',
  exportStatic: {},
  resolve: {
    examples: ['none'],
  },
  styles: [
    `
      .markdown table {
        width: auto !important;
      }
    `,
  ]
});
