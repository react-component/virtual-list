# @rc-component/virtual-list

React Virtual List Component which works with animation.

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]
[![build status][github-actions-image]][github-actions-url]
[![Codecov][codecov-image]][codecov-url]
[![bundle size][bundlephobia-image]][bundlephobia-url]
[![dumi][dumi-image]][dumi-url]

[npm-image]: https://img.shields.io/npm/v/@rc-component/virtual-list.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@rc-component/virtual-list
[travis-image]: https://img.shields.io/travis/react-component/virtual-list/master?style=flat-square
[travis-url]: https://travis-ci.com/react-component/virtual-list
[github-actions-image]: https://github.com/react-component/virtual-list/actions/workflows/main.yml/badge.svg
[github-actions-url]: https://github.com/react-component/virtual-list/actions/workflows/main.yml
[codecov-image]: https://img.shields.io/codecov/c/github/react-component/virtual-list/master.svg?style=flat-square
[codecov-url]: https://app.codecov.io/gh/react-component/virtual-list
[david-url]: https://david-dm.org/react-component/virtual-list
[david-image]: https://david-dm.org/react-component/virtual-list/status.svg?style=flat-square
[david-dev-url]: https://david-dm.org/react-component/virtual-list?type=dev
[david-dev-image]: https://david-dm.org/react-component/virtual-list/dev-status.svg?style=flat-square
[download-image]: https://img.shields.io/npm/dm/@rc-component/virtual-list.svg?style=flat-square
[download-url]: https://npmjs.org/package/@rc-component/virtual-list
[bundlephobia-url]: https://bundlephobia.com/package/@rc-component/virtual-list
[bundlephobia-image]: https://badgen.net/bundlephobia/minzip/@rc-component/virtual-list
[dumi-url]: https://github.com/umijs/dumi
[dumi-image]: https://img.shields.io/badge/docs%20by-dumi-blue?style=flat-square

## Online Preview

https://virtual-list-react-component.vercel.app/

## Development

```bash
npm install
npm start
open http://localhost:8000/
```

## Feature

- Support react.js
- Support animation
- Support IE11+

## Install

[![@rc-component/virtual-list](https://nodei.co/npm/@rc-component/virtual-list.png)](https://npmjs.org/package/@rc-component/virtual-list)

## Usage

```tsx
import List from '@rc-component/virtual-list';

<List data={[0, 1, 2]} height={200} itemHeight={30} itemKey="id">
  {(index) => <div>{index}</div>}
</List>;
```

# API

## List

| Prop       | Description                                             | Type                                                                                                                                                                                  | Default |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| children   | Render props of item                                    | (item, index, props) => ReactElement                                                                                                                                                  | -       |
| component  | Customize List dom element                              | string \| Component                                                                                                                                                                   | div     |
| data       | Data list                                               | Array                                                                                                                                                                                 | -       |
| disabled   | Disable scroll check. Usually used on animation control | boolean                                                                                                                                                                               | false   |
| height     | List height                                             | number                                                                                                                                                                                | -       |
| itemHeight | Item minimum height                                     | number                                                                                                                                                                                | -       |
| itemKey    | Match key with item                                     | string                                                                                                                                                                                | -       |
| styles     | style                                                   | { horizontalScrollBar?: React.CSSProperties; horizontalScrollBarThumb?: React.CSSProperties; verticalScrollBar?: React.CSSProperties; verticalScrollBarThumb?: React.CSSProperties; } | -       |

`children` provides additional `props` argument to support IE 11 scroll shaking.
It will set `style` to `visibility: hidden` when measuring. You can ignore this if no requirement on IE.
