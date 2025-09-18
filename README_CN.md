# docsify-sidebar-plus

[English Documentation](README.md)

## 简介
`docsify-sidebar-plus` 是一个用于增强 docsify 左侧菜单栏的插件。它提供了更多自定义选项和功能，使文档的导航更加灵活和强大。

## 功能特性
1. **多级菜单支持**：支持无限层级的菜单嵌套。
2. **自定义样式**：允许通过 CSS 自定义菜单的外观。
3. **动态加载**：支持异步加载菜单内容。
4. **搜索集成**：与 docsify 的搜索插件无缝集成。
5. **响应式设计**：适配不同屏幕尺寸的设备。

## 安装
1. 通过 npm 安装：
   ```bash
   npm install docsify-sidebar-plus
   ```
2. 或者直接引入 CDN 链接：
   ```html
   <script src="https://cdn.jsdelivr.net/npm/docsify-sidebar-plus@latest/dist/docsify-sidebar-plus.min.js"></script>
   ```

## 使用示例
```javascript
// index.html
window.$docsify = {
  plugins: [
    function(hook, vm) {
      hook.ready(function() {
        // 初始化插件
        window.DocsifySidebarPlus.init({
          // 配置项
        });
      });
    }
  ]
};
```

## 目录格式
```markdown
* 目录1
  * [标题1](/路径1)
  * [标题2](/路径2)
  * [标题3](/路径3)
* 目录2
  * [标题4](/路径4)
```

[](./README_CN.png)

## 配置选项
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `maxLevel` | number | 2 | 最大菜单层级 |
| `customCSS` | string | null | 自定义 CSS 文件路径 |
| `asyncLoad` | boolean | false | 是否异步加载菜单 |

## 贡献
欢迎提交 Issue 或 Pull Request 来改进此插件。
