<div align="center">
  <h1>@rc-component/virtual-list</h1>
  <p><sub>Ant Design 生态的一部分。</sub></p>
  <p>🧾 React 虚拟列表组件，用于高性能渲染长列表。</p>
  <p>
    <a href="https://www.npmjs.com/package/@rc-component/virtual-list"><img src="https://img.shields.io/npm/v/@rc-component/virtual-list.svg?style=flat-square" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/@rc-component/virtual-list"><img src="https://img.shields.io/npm/dm/@rc-component/virtual-list.svg?style=flat-square" alt="npm downloads" /></a>
    <a href="https://github.com/react-component/virtual-list/actions/workflows/react-component-ci.yml"><img src="https://github.com/react-component/virtual-list/actions/workflows/react-component-ci.yml/badge.svg" alt="CI" /></a>
    <a href="https://app.codecov.io/gh/react-component/virtual-list"><img src="https://img.shields.io/codecov/c/github/react-component/virtual-list/master.svg?style=flat-square" alt="Codecov" /></a>
    <a href="https://bundlephobia.com/package/@rc-component/virtual-list"><img src="https://badgen.net/bundlephobia/minzip/@rc-component/virtual-list" alt="bundle size" /></a>
    <a href="https://github.com/umijs/dumi"><img src="https://img.shields.io/badge/docs%20by-dumi-blue?style=flat-square" alt="dumi" /></a>
  </p>
</div>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>


## 特性

- Built for React and maintained by the rc-component team.
- 被 Ant Design 使用和其他 React 组件库使用。
- 提供 TypeScript declarations with both ES module and CommonJS outputs.
- 保留 examples, tests, and preview builds aligned with the package source.

## 安装

```bash
npm install @rc-component/virtual-list
```

## 使用

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

## 示例

Run the local dumi site to explore the examples:

```bash
npm install
npm start
```

## API

### List

| 属性 | 说明 | 类型 | 默认值 |
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

## 本地开发

```bash
npm install
npm start
npm test
npm run build
```

## 发布

```bash
npm run prepublishOnly
```

The release flow is handled by `@rc-component/np` through the `rc-np` command after the package build.

## 许可证

@rc-component/virtual-list is released under the [MIT](./LICENSE) license.
