<div align="center">
  <h1>@rc-component/virtual-list</h1>
  <p><sub><a href="https://ant.design"><img alt="Ant Design" height="14" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" style="vertical-align: -0.125em;" /></a> Part of the Ant Design ecosystem.</sub></p>
  <p>📜 Virtual scrolling list component for React.</p>

  <p>
    <a href="https://npmjs.org/package/@rc-component/virtual-list"><img alt="NPM version" src="https://img.shields.io/npm/v/@rc-component/virtual-list.svg?style=flat-square"></a>
    <a href="https://npmjs.org/package/@rc-component/virtual-list"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@rc-component/virtual-list.svg?style=flat-square"></a>
    <a href="https://github.com/react-component/virtual-list/actions/workflows/react-component-ci.yml"><img alt="build status" src="https://github.com/react-component/virtual-list/actions/workflows/react-component-ci.yml/badge.svg"></a>
    <a href="https://app.codecov.io/gh/react-component/virtual-list"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/react-component/virtual-list/master.svg?style=flat-square"></a>
    <a href="https://bundlephobia.com/package/@rc-component/virtual-list"><img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/@rc-component/virtual-list?style=flat-square"></a>
    <a href="https://github.com/umijs/dumi"><img alt="dumi" src="https://img.shields.io/badge/docs%20by-dumi-blue?style=flat-square"></a>
  </p>
</div>

<p align="center">English | <a href="./README.zh-CN.md">简体中文</a></p>

## Highlights

- Built for React and maintained by the rc-component team.
- Used by Ant Design and other React component libraries.
- Ships TypeScript declarations with both ES module and CommonJS outputs.
- Keeps examples, tests, and preview builds aligned with the package source.

## Install

```bash
npm install @rc-component/virtual-list
```

## Usage

```tsx
import List from '@rc-component/virtual-list';

const data = Array.from({ length: 1000 }).map((_, index) => ({
  id: index,
  label: `Item ${index}`,
}));

export default () => (
  <List data={data} height={240} itemHeight={32} itemKey="id">
    {(item) => <div>{item.label}</div>}
  </List>
);
```

## Examples

Run the local dumi site:

```bash
npm install
npm start
```

Then open `http://localhost:8000`.

## API

### List

| Prop       | Description                                                                                                            | Type                                   | Default |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------- |
| children   | Render function for each item. The third argument contains measuring props used by legacy browser compatibility paths. | `(item, index, props) => ReactElement` | -       |
| component  | Custom list container element.                                                                                         | `string` \| `ComponentType`            | `div`   |
| data       | Items rendered by the virtual list.                                                                                    | `T[]`                                  | -       |
| disabled   | Disable scroll position checks, usually while coordinating animation.                                                  | `boolean`                              | `false` |
| fullHeight | Whether the holder should keep full height.                                                                            | `boolean`                              | `true`  |
| height     | Visible list height.                                                                                                   | `number`                               | -       |
| itemHeight | Minimum item height used to calculate the virtual range.                                                               | `number`                               | -       |
| itemKey    | Key field or key getter for items.                                                                                     | `string` \| `(item) => React.Key`      | -       |
| onScroll   | Called when the list scrolls.                                                                                          | `React.UIEventHandler<HTMLElement>`    | -       |
| styles     | Custom scrollbar part styles.                                                                                          | `object`                               | -       |
| virtual    | Enable virtual rendering.                                                                                              | `boolean`                              | `true`  |

## Development

```bash
npm install
npm start
npm test
npm run build
```

The dumi site runs at `http://localhost:8000` by default.

## Release

```bash
npm run prepublishOnly
```

The release flow is handled by `@rc-component/np` through the `rc-np` command after the package build.

## License

@rc-component/virtual-list is released under the [MIT](./LICENSE) license.
