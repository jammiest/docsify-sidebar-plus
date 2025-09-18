# docsify-sidebar-plus

[中文文档](README_CN.md)

## Introduction
`docsify-sidebar-plus` is a plugin designed to enhance the left sidebar of docsify. It offers additional customization options and features, making document navigation more flexible and powerful.

## Features
1. **Multi-level Menu Support**: Supports unlimited levels of nested menus.
2. **Custom Styling**: Allows customizing the appearance of the menu via CSS.
3. **Dynamic Loading**: Supports asynchronous loading of menu content.
4. **Search Integration**: Seamlessly integrates with docsify's search plugin.
5. **Responsive Design**: Adapts to devices of different screen sizes.

## Installation
1. Via npm:
   ```bash
   npm install docsify-sidebar-plus
   ```
2. Or via CDN:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/docsify-sidebar-plus@latest/dist/docsify-sidebar-plus.min.js"></script>
   ```

## Usage Example
```javascript
window.$docsify = {
  plugins: [
    function(hook, vm) {
      hook.ready(function() {
        // Initialize the plugin
        window.DocsifySidebarPlus.init({
          // Configuration options
        });
      });
    }
  ]
};
```

## Configuration Options
| Parameter | Type | Default | Description |
|------|------|--------|------|
| `maxLevel` | number | 2 | Maximum menu level |
| `customCSS` | string | null | Path to custom CSS file |
| `asyncLoad` | boolean | false | Whether to load menu asynchronously |

## Contribution
Feel free to submit Issues or Pull Requests to improve this plugin.

## Language Switch
[中文文档](README_CN.md)