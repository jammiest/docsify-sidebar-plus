(function () {
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
      border-color: #00ff004a;
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
  `;
  document.head.appendChild(style);

  // 主函数
  function install(hook, vm) {
    hook.ready(function () {
      const sidebar = document.querySelector('.sidebar-nav');
      if (!sidebar) return;

      // 使用MutationObserver监听DOM变化
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
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

    function generateItemId(item) {
      // console.log(item.querySelector('ul li:first-child a').href ,item.childNodes[0].nodeValue.trim());
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