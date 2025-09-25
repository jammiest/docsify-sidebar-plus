# docsify-sidebar-plus

[中文文档](README_CN.md)

[![docsify Version](https://img.shields.io/badge/docsify-4.13.1+-9055F6)]() [![npm Version](https://img.shields.io/badge/npm-10.9.2+-blue)]()

## Introduction
`docsify-sidebar-plus` is a plugin designed to enhance the left sidebar of docsify. It offers additional customization options and features, making document navigation more flexible and powerful.

## Features
1. **Multi-level menu support**: Support for infinite levels of nested menus.
2. **Custom styles**: Allow customizing the appearance of the menu through CSS.
3. **Dynamic loading**: Support for asynchronous loading of menu content.
4. **Search integration**: Integration with docsify's search plugin.
5. **Responsive design**: Adapt to different screen sizes.

## Usage

  ```html
  
    <!-- Docsify v4 -->
  <script src="//cdn.jsdelivr.net/npm/docsify@4"></script>
  
  <script src="https://cdn.jsdelivr.net/npm/docsify-sidebar-plus@1.1.3/collapsible-sidebar.min.js"></script>
  
    <!-- Other scripts -->
  
  ```

## Directory Format
```markdown
* Category1
  * [Title1](/path1)
  * [Title2](/path2)
  * [Title3](/path3)
* Category2
  * [Title4](/path4)
```

### preview

![](./README.png)


## Configuration

```js

window.$docsify = {

    // Other configurations

      sidebarPlus: {  // Plugin configuration
        expireMinutes: 60, // Remember sidebar scroll position expiration time (minutes)
      }

  // Other configurations

}

```

## Contribution
Feel free to submit Issues or Pull Requests to improve this plugin.