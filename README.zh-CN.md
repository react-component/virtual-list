<div align="center">
  <h1>@rc-component/virtual-list</h1>
  <p><sub><a href="https://ant.design"><img alt="Ant Design" height="14" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" style="vertical-align: -0.125em;" /></a> Ant Design 生态的一部分。</sub></p>
  <p>📜 React 虚拟列表组件，用于高性能渲染长列表。</p>

  <p>
    <a href="https://npmjs.org/package/@rc-component/virtual-list"><img alt="NPM version" src="https://img.shields.io/npm/v/@rc-component/virtual-list.svg?style=flat-square"></a>
    <a href="https://npmjs.org/package/@rc-component/virtual-list"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@rc-component/virtual-list.svg?style=flat-square"></a>
    <a href="https://github.com/react-component/virtual-list/actions/workflows/react-component-ci.yml"><img alt="build status" src="https://github.com/react-component/virtual-list/actions/workflows/react-component-ci.yml/badge.svg"></a>
    <a href="https://app.codecov.io/gh/react-component/virtual-list"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/react-component/virtual-list/master.svg?style=flat-square"></a>
    <a href="https://bundlephobia.com/package/@rc-component/virtual-list"><img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/@rc-component/virtual-list?style=flat-square"></a>
    <a href="https://github.com/umijs/dumi"><img alt="dumi" src="https://img.shields.io/badge/docs%20by-dumi-blue?style=flat-square"></a>
  </p>
</div>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>

## 特性

- 面向 React 构建，并由 rc-component 团队维护。
- 被 Ant Design 使用和其他 React 组件库使用。
- 提供 TypeScript 类型声明，同时输出 ES module 和 CommonJS 产物。
- 示例、测试和预览构建与包源码保持一致。

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

运行本地 dumi 站点：

```bash
npm install
npm start
```

然后打开 `http://localhost:8000`。

## API

### List

| 属性       | 说明                                                               | 类型                                   | 默认值  |
| ---------- | ------------------------------------------------------------------ | -------------------------------------- | ------- |
| children   | 每一项的渲染函数。第三个参数包含旧浏览器兼容路径使用的测量 props。 | `(item, index, props) => ReactElement` | -       |
| component  | 自定义列表容器元素。                                               | `string` \| `ComponentType`            | `div`   |
| data       | 虚拟列表渲染的数据项。                                             | `T[]`                                  | -       |
| disabled   | 禁用滚动位置检查，通常用于配合动画。                               | `boolean`                              | `false` |
| fullHeight | holder 是否保持完整高度。                                          | `boolean`                              | `true`  |
| height     | 可视列表高度。                                                     | `number`                               | -       |
| itemHeight | 用于计算虚拟范围的最小项高度。                                     | `number`                               | -       |
| itemKey    | 数据项 key 字段或 key 获取函数。                                   | `string` \| `(item) => React.Key`      | -       |
| onScroll   | 列表滚动时调用。                                                   | `React.UIEventHandler<HTMLElement>`    | -       |
| styles     | 自定义滚动条部位样式。                                             | `object`                               | -       |
| virtual    | 启用虚拟渲染。                                                     | `boolean`                              | `true`  |

## 本地开发

```bash
npm install
npm start
npm test
npm run build
```

dumi 站点默认运行在 `http://localhost:8000`。

## 发布

```bash
npm run prepublishOnly
```

包构建完成后，发布流程由 `@rc-component/np` 通过 `rc-np` 命令处理。

## 许可证

@rc-component/virtual-list 基于 [MIT](./LICENSE) 许可证发布。
