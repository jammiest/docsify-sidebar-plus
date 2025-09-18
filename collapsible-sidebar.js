(function() {
  // 使用CSS变量提高可定制性
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --collapse-btn-size: 16px;
      --collapse-btn-color: var(--theme-color, #42b983);
      --collapse-transition: 0.2s ease;
      --item-spacing: 5px;
    }
    
    .sidebar-nav .collapse-btn {
      position: absolute;
      top: 15px;
      right: 5px;
      width: var(--collapse-btn-size);
      height: var(--collapse-btn-size);
      cursor: pointer;
      transform: translateY(-50%);
      transition: transform var(--collapse-transition);
      background: none;
      border: none;
      padding: 0;
    }
    
    .sidebar-nav .collapse-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-left: 6px solid var(--collapse-btn-color);
      transform: translate(-50%, -50%);
      transition: transform var(--collapse-transition);
    }
    
    .sidebar-nav .collapse-btn.collapsed::before {
      transform: translate(-50%, -50%) rotate(90deg);
    }
    
    .sidebar-nav ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }
    
    .sidebar-nav li {
      position: relative;
      margin: var(--item-spacing) 0;
      padding-right: calc(var(--collapse-btn-size) + 10px);
      padding-left: 10px;
    }
    
    .sidebar-nav li > ul {
      padding-left: 15px;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    
    .sidebar-nav li.collapsed > ul {
      max-height: 0 !important;
    }
    
    .sidebar-nav li > a {
      display: block;
      position: relative;
      padding-right: 15px;
    }
    
    /* 添加悬停效果 */
    .sidebar-nav .collapse-btn:hover::before {
      opacity: 0.8;
    }
    
    /* 响应式调整 */
    @media (max-width: 768px) {
      .sidebar-nav li {
        padding-right: calc(var(--collapse-btn-size) + 8px);
      }
    }
  `;
  document.head.appendChild(style);

  // 主函数
  function install(hook, vm) {
    hook.ready(function() {
      const sidebar = document.querySelector('.sidebar-nav');
      if (!sidebar) return;

      // 使用MutationObserver监听DOM变化
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            initCollapseButtons();
          }
        });
      });

      observer.observe(sidebar, {
        childList: true,
        subtree: true
      });

      initCollapseButtons();
    });

    function initCollapseButtons() {
      const sidebar = document.querySelector('.sidebar-nav');
      if (!sidebar) return;

      // 为所有有子菜单的li元素添加折叠按钮
      const itemsWithChildren = sidebar.querySelectorAll('li:has(ul)');
      
      itemsWithChildren.forEach(item => {
        // 如果已经初始化过则跳过
        if (item.dataset.collapseInitialized) return;
        item.dataset.collapseInitialized = 'true';
        
        // 生成更可靠的唯一ID
        const itemId = generateItemId(item);
        
        // 创建折叠按钮
        const btn = document.createElement('button');
        btn.className = 'collapse-btn';
        btn.setAttribute('aria-label', 'Toggle submenu');
        btn.dataset.itemId = itemId;
        
        // 将按钮添加到li的最后面（在链接之后）
        item.appendChild(btn);
        
        // 初始化状态
        const isCollapsed = localStorage.getItem(`sidebar-collapse-${itemId}`);
        if (isCollapsed === 'true') {
          toggleCollapse(item, btn, true);
        }
        
        // 事件处理
        setupButtonEvents(btn, item, itemId);
      });
    }

    function generateItemId(item) {
      // 使用更可靠的ID生成方式
      const path = [];
      let current = item;
      
      while (current && current !== document.body) {
        const link = current.querySelector('a');
        if (link && link.textContent) {
          path.unshift(link.textContent.trim());
        }
        current = current.parentElement;
      }
      
      return path.join('::').replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }

    function toggleCollapse(item, btn, state) {
      const shouldCollapse = state !== undefined ? state : !item.classList.contains('collapsed');
      
      item.classList.toggle('collapsed', shouldCollapse);
      btn.classList.toggle('collapsed', shouldCollapse);
      
      // 添加ARIA属性
      btn.setAttribute('aria-expanded', String(!shouldCollapse));
    }

    function setupButtonEvents(btn, item, itemId) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isCollapsed = !item.classList.contains('collapsed');
        toggleCollapse(item, btn, isCollapsed);
        
        // 保存状态到localStorage
        localStorage.setItem(
          `sidebar-collapse-${itemId}`,
          isCollapsed
        );
        
        // 阻止事件冒泡到父菜单项
        return false;
      });
      
      // 防止点击链接时影响按钮
      const link = item.querySelector('a');
      if (link) {
        link.addEventListener('click', function(e) {
          // 如果点击的是按钮或按钮的子元素，阻止默认行为
          if (e.target === btn || btn.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    }
  }

  // 注册插件
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = [].concat(window.$docsify.plugins || [], install);
})();