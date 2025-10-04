(function () {
  // 使用CSS变量提高可定制性
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --collapse-btn-size: 16px;
      --collapse-btn-color: var(--theme-color, #42b983);
      --collapse-li-border-color: #00ff004a;
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
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 10px solid var(--collapse-btn-color);
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
    .sidebar-nav>ul>li {
      border-width: 1px;
      border-color: var(--collapse-li-border-color, #00ff004a);
      border-style: solid;
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
/* 无效链接样式 */
.invalid-link {
  position: relative;
  opacity: 0.6;
  color: #dc3545 !important;
  text-decoration: line-through;
}

.invalid-link:hover {
  opacity: 0.8;
}

.invalid-link::after {
  content: " ⚠️";
  color: #ffc107;
  font-weight: bold;
}

.invalid-link-hidden {
  display: none !important;
}

/* 可选：添加加载状态 */
.link-checking {
  opacity: 0.7;
  pointer-events: none;
}
  `;
  document.head.appendChild(style);

  // 主函数
  function install(hook, vm) {
    const config = vm.config.sidebarPlus || {};

    config.expireMinutes = config.expireMinutes || 60;

    hook.ready(function () {
      const sidebar = document.querySelector('.sidebar-nav');
      if (!sidebar) return;


      var scrollInfo = localStorage.getItem('docsify.sidebar.' + md5(vm.route.path) + '.scrollPosition');
      var scrollPosition = scrollInfo ? scrollInfo.split(',')[0] : 0;
      if (scrollInfo && scrollInfo.split(',').length >= 2 && Number(scrollInfo.split(',')[1]) > (new Date()).getTime() / 60) {
        document.querySelector('main>aside.sidebar').scrollTop = scrollPosition;
      }
      document.querySelector('main>aside.sidebar').addEventListener('scroll', function (e) {
        scrollPosition = e.target.scrollTop
      });

      setInterval(function () {
        localStorage.setItem('docsify.sidebar.' + md5(vm.route.path) + '.scrollPosition', scrollPosition + ',' + ((new Date()).getTime() / 60 + config.expireMinutes));
      }, 2000);

      // 使用MutationObserver监听DOM变化
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.addedNodes.length) {
            currentPathMD5 = md5(window.Docsify.util.getParentPath(vm.route.path))
            var storageStr = localStorage.getItem('docsify.sidebar.currentSidebar');
            var cacheExpireTime = (new Date()).getTime() / 60 + 10;
            if (storageStr && storageStr.split(',').length >= 2) {
              cacheExpireTime = Number(storageStr.split(',')[1])
              storageStr = storageStr.split(',')[0]
            }
            localStorage.setItem('docsify.sidebar.currentSidebar', currentPathMD5 + ',' + ((new Date()).getTime() / 60 + config.expireMinutes));

            // console.log(storageStr, currentPathMD5, cacheExpireTime < (new Date()).getTime() / 60);

            if (storageStr == undefined || storageStr != currentPathMD5 || cacheExpireTime < (new Date()).getTime() / 60) {
              initCollapseButtons();
              invalidLink();
            }
          }
        });
      });

      observer.observe(sidebar, {
        childList: true,
        subtree: true
      });

      currentPathMD5 = md5(window.Docsify.util.getParentPath(vm.route.path))
      var storageStr = localStorage.getItem('docsify.sidebar.currentSidebar');
      var cacheExpireTime = (new Date()).getTime() / 60 + 10;
      if (storageStr && storageStr.split(',').length >= 2) {
        cacheExpireTime = Number(storageStr.split(',')[1])
        storageStr = storageStr.split(',')[0]
      }
      localStorage.setItem('docsify.sidebar.currentSidebar', currentPathMD5 + ',' + ((new Date()).getTime() / 60 + config.expireMinutes));
      // console.log(storageStr, currentPathMD5, cacheExpireTime < (new Date()).getTime() / 60);
      initCollapseButtons();
      invalidLink();
    });


    /**
     * 检查markdown文件是否存在（带10分钟缓存）
     * @param {string} path 路由路径，如 'markdown'
     * @param {number} linkCheckCacheTime 链接检查缓存时间，单位：分钟
     * @returns {Promise<boolean>} 文件是否存在
     */
    const checkMarkdownFileExists = (function () {
      // 缓存对象，存储文件存在性检查结果
      const cache = new Map();
      return async function (path,linkCheckCacheTime) {
        try {
          // 构建缓存键
          const cacheKey = `docsify.sidebar.file.exists.${path}`;

          // 检查缓存是否存在且未过期
          const cached = cache.get(cacheKey);
          const now = Date.now();

          if (cached && (now - cached.timestamp /60 /1000 < linkCheckCacheTime)) {
            // console.log(`📁 使用缓存结果: ${path}.md -> ${cached.exists}`);
            return cached.exists;
          }
          // console.log(path);
          // 移除路径开头的斜杠，构建文件路径
          path = path ? path : 'README'
          path = path.endsWith('/') ? path + 'README' : path;
          const filePath = path.startsWith('/') ? path.slice(1) + '.md' : path + '.md';
          // const filePath = path;
          // 使用Docsify的get方法请求文件
          const content = await Docsify.get(filePath);

          // 如果内容为空或返回404，则认为文件不存在
          const exists = !(!content || content.includes('404') || content.trim() === '');

          // console.log(`🔍 检查文件: ${filePath} : ${exists}`);


          // 更新缓存
          cache.set(cacheKey, {
            exists: exists,
            timestamp: now,
            filePath: filePath
          });

          return exists;

        } catch (error) {
          // 即使是错误也缓存，避免频繁请求失败的文件
          const cacheKey = `docsify.sidebar.file.exists.${path}`;
          cache.set(cacheKey, {
            exists: false,
            timestamp: Date.now(),
            filePath: path + '.md',
            error: error.message
          });

          return false;
        }
      };
    })();

    function initCollapseButtons() {
      const sidebar = document.querySelector('.sidebar-nav ul');
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
        const isCollapsed = localStorage.getItem(`docsify.sidebar.collapse.${itemId}`);
        if (isCollapsed === 'true') {
          toggleCollapse(item, btn, true);
        }

        // 事件处理
        setupButtonEvents(btn, item, itemId);
      });
    }

    /**
     * 检测并处理无效链接
     */
    async function invalidLink() {
      const config = vm.config.sidebarPlus || {};
      const flag = config.invalidLinkStyle || 'show'; // 无效的链接菜单控制，隐藏|异常提醒|显示(默认) hide|alert|show
      const invalidLinkTitle = config.invalidLinkTitle || 'invaild link'; // 无效链接提示文本，默认'invaild link'
      const linkCheckCacheTime = config.linkCheckCacheTime || 10; // 链接可用性异步检测缓存时间（分钟），默认10分钟
      // 如果不需要处理无效链接，直接返回
      if (flag === 'show') {
        return;
      }

      try {
        // 获取侧边栏所有链接
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        if (!sidebarLinks.length) {
          // console.log('未找到侧边栏链接');
          return;
        }

        // 获取当前路由信息
        const basePath = vm.router.getBasePath();
        const currentPath = vm.route.path;

        // console.log(`🔍 开始检测无效链接，模式: ${flag}, 共 ${sidebarLinks.length} 个链接`);

        // 批量检查链接有效性
        const checkPromises = Array.from(sidebarLinks).map(async (link) => {
          const href = link.getAttribute('href');
          if (!href || !href.includes('#/')) {
            return; // 跳过非内部链接
          }

          try {
            // 提取路由路径
            const routeMatch = href.match(/#\/([^?]*)/);
            if (!routeMatch) return;

            let routePath = routeMatch[1];

            // 处理相对路径（转换为绝对路径比较）
            if (routePath.startsWith('./')) {
              routePath = basePath + routePath.slice(2);
            } else if (routePath.startsWith('../')) {
              routePath = vm.router.getParentPath(basePath) + routePath.slice(3);
            }

            // 检查文件是否存在
            const exists = await checkMarkdownFileExists(routePath,linkCheckCacheTime);

            if (!exists) {
              // console.warn(`❌ 无效链接: ${routePath}`);

              // 根据配置处理无效链接
              handleInvalidLink(link, routePath, flag,invalidLinkTitle);
            } else {
              // 确保有效链接没有无效样式
              link.classList.remove('invalid-link', 'invalid-link-hidden');
              link.style.display = '';
              link.title = link.title.replace('${invalidLinkTitle}', '');
            }

          } catch (error) {
            // console.error(`检查链接 ${href} 时出错:`, error);
          }
        });

        // 等待所有检查完成
        await Promise.allSettled(checkPromises);
        // console.log('✅ 无效链接检测完成');

      } catch (error) {
        // console.error('无效链接检测失败:', error);
      }
    }

    /**
     * 处理无效链接
     */
    function handleInvalidLink(link, routePath, flag,invalidLinkTitle) {
      const originalTitle = link.getAttribute('data-original-title') || link.title;

      switch (flag) {
        case 'hide':
          // 隐藏无效链接
          link.style.display = 'none';
          link.classList.add('invalid-link-hidden');
          break;

        case 'alert':
          // 添加视觉提示
          link.classList.add('invalid-link');
          link.title = invalidLinkTitle;

          // 添加点击警告
          const originalClick = link.onclick;
          link.onclick = function (e) {
            if (link.classList.contains('invalid-link')) {
              // console.warn(`⚠️ 文件不存在: ${routePath}.md`);
            }
            if (originalClick) return originalClick.call(this, e);
          };
          break;

        default:
          // 默认显示，但添加样式提示
          link.classList.add('invalid-link');
          link.title = invalidLinkTitle;
          break;
      }

      // 保存原始标题
      if (!link.getAttribute('data-original-title')) {
        link.setAttribute('data-original-title', originalTitle);
      }
    }

    /**
     * 重置链接状态（用于重新检查）
     */
    function resetLinkStates() {
      const links = document.querySelectorAll('.sidebar-nav a');
      links.forEach(link => {
        link.classList.remove('invalid-link', 'invalid-link-hidden');
        link.style.display = '';

        const originalTitle = link.getAttribute('data-original-title');
        if (originalTitle) {
          link.title = originalTitle;
        }

        // 恢复原始点击事件（简化处理）
        link.onclick = null;
      });
    }

    function generateItemId(item) {
      return md5(item.querySelector('ul li:first-child a').href);
    }

    function toggleCollapse(item, btn, state) {
      const shouldCollapse = state !== undefined ? state : !item.classList.contains('collapsed');

      item.classList.toggle('collapsed', shouldCollapse);
      btn.classList.toggle('collapsed', shouldCollapse);

      // 添加ARIA属性
      btn.setAttribute('aria-expanded', String(!shouldCollapse));
    }

    function setupButtonEvents(btn, item, itemId) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = !item.classList.contains('collapsed');
        toggleCollapse(item, btn, isCollapsed);
        // 保存状态到localStorage
        if (!item.querySelector('ul:has(.active)')) {
          localStorage.setItem(
            `docsify.sidebar.collapse.${itemId}`,
            isCollapsed
          );
        }

        // 阻止事件冒泡到父菜单项
        return false;
      });

      // 防止点击链接时影响按钮
      const link = item.querySelector('a');
      if (link) {
        link.addEventListener('click', function (e) {
          // 如果点击的是按钮或按钮的子元素，阻止默认行为
          if (e.target === btn || btn.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    }
  }

  function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function addUnsigned(lX, lY) {
      let lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      if (lX4 | lY4) {
        if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      } else return (lResult ^ lX8 ^ lY8);
    }

    function utf8Encode(string) {
      string = string.replace(/\r\n/g, '\n');
      let utftext = '';
      for (let n = 0; n < string.length; n++) {
        const c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }

    let x = [];
    let k, AA, BB, CC, DD, a, b, c, d;
    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    string = utf8Encode(string);

    x = (function (str) {
      const bin = [];
      const mask = (1 << 8) - 1;
      for (let i = 0; i < str.length * 8; i += 8) {
        bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
      }
      return bin;
    })(string);

    const oldLength = string.length * 8;
    x[oldLength >> 5] |= 0x80 << (oldLength % 32);
    x[(((oldLength + 64) >>> 9) << 4) + 14] = oldLength;

    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;

    for (let i = 0; i < x.length; i += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;

      a = FF(a, b, c, d, x[i + 0], S11, 0xD76AA478);
      d = FF(d, a, b, c, x[i + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[i + 2], S13, 0x242070DB);
      b = FF(b, c, d, a, x[i + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[i + 4], S11, 0xF57C0FAF);
      d = FF(d, a, b, c, x[i + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[i + 6], S13, 0xA8304613);
      b = FF(b, c, d, a, x[i + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[i + 8], S11, 0x698098D8);
      d = FF(d, a, b, c, x[i + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[i + 10], S13, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[i + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[i + 12], S11, 0x6B901122);
      d = FF(d, a, b, c, x[i + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[i + 14], S13, 0xA679438E);
      b = FF(b, c, d, a, x[i + 15], S14, 0x49B40821);

      a = GG(a, b, c, d, x[i + 1], S21, 0xF61E2562);
      d = GG(d, a, b, c, x[i + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[i + 11], S23, 0x265E5A51);
      b = GG(b, c, d, a, x[i + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[i + 5], S21, 0xD62F105D);
      d = GG(d, a, b, c, x[i + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[i + 15], S23, 0xD8A1E681);
      b = GG(b, c, d, a, x[i + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[i + 9], S21, 0x21E1CDE6);
      d = GG(d, a, b, c, x[i + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[i + 3], S23, 0xF4D50D87);
      b = GG(b, c, d, a, x[i + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[i + 13], S21, 0xA9E3E905);
      d = GG(d, a, b, c, x[i + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[i + 7], S23, 0x676F02D9);
      b = GG(b, c, d, a, x[i + 12], S24, 0x8D2A4C8A);

      a = HH(a, b, c, d, x[i + 5], S31, 0xFFFA3942);
      d = HH(d, a, b, c, x[i + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[i + 11], S33, 0x6D9D6122);
      b = HH(b, c, d, a, x[i + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[i + 1], S31, 0xA4BEEA44);
      d = HH(d, a, b, c, x[i + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[i + 7], S33, 0xF6BB4B60);
      b = HH(b, c, d, a, x[i + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[i + 13], S31, 0x289B7EC6);
      d = HH(d, a, b, c, x[i + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[i + 3], S33, 0xD4EF3085);
      b = HH(b, c, d, a, x[i + 6], S34, 0x4881D05);
      a = HH(a, b, c, d, x[i + 9], S31, 0xD9D4D039);
      d = HH(d, a, b, c, x[i + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[i + 15], S33, 0x1FA27CF8);
      b = HH(b, c, d, a, x[i + 2], S34, 0xC4AC5665);

      a = II(a, b, c, d, x[i + 0], S41, 0xF4292244);
      d = II(d, a, b, c, x[i + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[i + 14], S43, 0xAB9423A7);
      b = II(b, c, d, a, x[i + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[i + 12], S41, 0x655B59C3);
      d = II(d, a, b, c, x[i + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[i + 10], S43, 0xFFEFF47D);
      b = II(b, c, d, a, x[i + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[i + 8], S41, 0x6FA87E4F);
      d = II(d, a, b, c, x[i + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[i + 6], S43, 0xA3014314);
      b = II(b, c, d, a, x[i + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[i + 4], S41, 0xF7537E82);
      d = II(d, a, b, c, x[i + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[i + 2], S43, 0x2AD7D2BB);
      b = II(b, c, d, a, x[i + 9], S44, 0xEB86D391);

      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    const temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

    return temp.toLowerCase();

    function FF(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function GG(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function HH(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function II(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function F(x, y, z) {
      return (x & y) | (~x & z);
    }

    function G(x, y, z) {
      return (x & z) | (y & ~z);
    }

    function H(x, y, z) {
      return x ^ y ^ z;
    }

    function I(x, y, z) {
      return y ^ (x | ~z);
    }

    function wordToHex(lValue) {
      let word = '';
      for (let i = 0; i < 4; i++) {
        word += String.fromCharCode((lValue >>> (i * 8)) & 255);
      }
      return word.split('').map(c => {
        const hex = c.charCodeAt(0).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
  }

  // 注册插件
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = [].concat(window.$docsify.plugins || [], install);
})();