// ==UserScript==
// @name         MoonTrade Mod
// @version      3.0
// @description  MoonTrade Mod: телефон (iPhone / Android) і ПК — панель кнопок, стиль MoonTrade, чистий інтерфейс, звук і гарячі клавіші
// @match        https://pocketoption.com/*
// @match        https://*.pocketoption.com/*
// @run-at       document-end
// @inject-into  page
// @noframes
// ==/UserScript==

(function () {
  'use strict';
  if (window.__MT_LOADER__) return;
  window.__MT_LOADER__ = true;

  var UA = navigator.userAgent || '';
  var MOBILE = /iPhone|iPod|Android.+Mobile/i.test(UA) ||
    (window.matchMedia && matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 600);

  // ---------- збереження дрібних налаштувань (тільки зручності, без критичних даних) ----------
  function lsGet(k, d) { try { var v = localStorage.getItem('mt_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem('mt_' + k, JSON.stringify(v)); } catch (e) {} }

  // ---------- поточний % виплати з інтерфейсу PO ----------
  function curPct() {
    var e = document.querySelector('.payout__text-p');
    var m = e && (e.textContent || '').match(/(\d{1,3})\s*%/);
    return m ? m[1] + '%' : null;
  }

  // ---------- «Поділитися»: на телефоні мод відправляв "Виплата$895" замість відсотка ----------
  (function () {
    var WS = window.WebSocket;
    if (!WS || !WS.prototype || WS.prototype.__mtPatched) return;
    var orig = WS.prototype.send;
    WS.prototype.send = function (d) {
      try {
        if (typeof d === 'string' && d.indexOf('"share"') > -1 && /moontrade/i.test(this.url || '')) {
          var o = JSON.parse(d);
          if (o && o.type === 'share' && o.payout != null && String(o.payout).indexOf('%') === -1) {
            var p = curPct();
            if (p) { o.payout = p; d = JSON.stringify(o); }
          }
        }
      } catch (e) {}
      return orig.call(this, d);
    };
    WS.prototype.__mtPatched = true;
  })();

  // ---------- повзунки діапазонів виплат: дотик пальцем = перетягування мишкою ----------
  (function () {
    var active = null;
    function fire(type, t, target) {
      var o = { bubbles: true, cancelable: true, view: window, clientX: t.clientX, clientY: t.clientY,
        screenX: t.screenX, screenY: t.screenY, button: 0, buttons: type === 'mouseup' ? 0 : 1 };
      (target || document).dispatchEvent(new MouseEvent(type, o));
    }
    document.addEventListener('touchstart', function (e) {
      var h = e.target && e.target.closest && e.target.closest('#po-range-wrap [title^="Перетягніть"]');
      if (!h || e.touches.length !== 1) return;
      active = h; e.preventDefault(); fire('mousedown', e.touches[0], h);
    }, { passive: false, capture: true });
    document.addEventListener('touchmove', function (e) {
      if (!active) return;
      e.preventDefault(); fire('mousemove', e.touches[0], document); fire('mousemove', e.touches[0], window);
    }, { passive: false, capture: true });
    function end(e) {
      if (!active) return;
      var t = e.changedTouches[0]; fire('mouseup', t, document); fire('mouseup', t, window); active = null;
    }
    document.addEventListener('touchend', end, { capture: true });
    document.addEventListener('touchcancel', end, { capture: true });
  })();

  // ---------- шрифти MoonTrade ----------
  try {
    var fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700&display=swap';
    document.head.appendChild(fl);
  } catch (e) {}

  // ---------- стилі ----------
  var CSS = [
    ':root{--mt-night:#0d0a1f;--mt-deep:#151032;--mt-panel:#160f2b;--mt-panel2:#1c1542;--mt-line:#2c2554;',
    '--mt-ink:#f1ecff;--mt-muted:#a99fcc;--mt-moon:#cdbdff;--mt-violet:#8b5cf6;--mt-violet2:#6d3df0;',
    '--mt-mint:#3fe0a0;--mt-rose:#ff6b8a;--mt-amber:#ffc85c;',
    '--mt-font:"Manrope",system-ui,-apple-system,sans-serif;--mt-display:"Unbounded","Manrope",system-ui,sans-serif;',
    '--mt-grad:linear-gradient(135deg,#6d3df0,#8b5cf6);}',

    /* ===== Меню налаштувань: стиль MoonTrade ===== */
    '#po-modal{background:linear-gradient(180deg,rgba(28,21,66,.97),rgba(13,10,31,.98))!important;border:1px solid var(--mt-line)!important;',
    'border-radius:20px!important;box-shadow:0 28px 80px rgba(0,0,0,.6),0 0 0 1px rgba(139,92,246,.12)!important;',
    'font-family:var(--mt-font)!important;color:var(--mt-ink)!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);}',
    '#po-modal *{font-family:var(--mt-font)!important;}',
    '#po-modal > div:first-child{border-bottom:1px solid var(--mt-line)!important;}',
    '#po-modal > div:first-child > span{font-family:var(--mt-display)!important;font-size:14px!important;letter-spacing:.2px;color:var(--mt-ink)!important;}',
    '#po-modal .po-toggle-row > span:first-child{color:var(--mt-ink)!important;font-weight:600;}',
    '#po-modal .po-toggle[data-on="true"]{background:var(--mt-grad)!important;}',
    '#po-modal .po-toggle[data-on="false"]{background:#2c2554!important;}',
    '#po-modal input{background:var(--mt-night)!important;border:1px solid var(--mt-line)!important;border-radius:12px!important;color:var(--mt-ink)!important;}',
    '#po-modal input:focus{border-color:var(--mt-violet)!important;}',
    '#po-nickname-save{background:var(--mt-grad)!important;border-radius:999px!important;font-weight:700!important;}',
    '#po-pin-btn,#po-range-wrap button{background:rgba(139,92,246,.10)!important;border:1px solid var(--mt-line)!important;color:var(--mt-moon)!important;border-radius:999px!important;}',
    '#po-modal-close{color:var(--mt-muted)!important;}',

    /* ===== Картки сигналів (BB / ST+CCI / від трейдерів): стиль MoonTrade ===== */
    '#po-scanner-list > li,#po-share-list > li,#po-alerts .po-alert-wrap{background:rgba(22,15,43,.95)!important;',
    'border-radius:16px!important;font-family:var(--mt-font)!important;box-shadow:0 10px 30px rgba(0,0,0,.45)!important;',
    '-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}',
    '#po-scanner-list > li *,#po-share-list > li *{font-family:var(--mt-font)!important;}',

    /* HUD при перемиканні активу */
    '#po-hud{background:rgba(22,15,43,.92)!important;border:1px solid var(--mt-line)!important;border-radius:16px!important;font-family:var(--mt-font)!important;}',
    /* компактно: актив і дохідність в один рядок */
    '#po-hud{display:flex!important;align-items:center!important;gap:10px!important;padding:6px 14px!important;min-width:0!important;border-radius:12px!important;line-height:1.2!important;}',
    '#po-hud > div{margin:0!important;}',
    '#po-hud > div:first-child{font:600 13px/1.2 var(--mt-font)!important;color:var(--mt-ink)!important;}',
    '#po-hud > div:last-child{font:800 18px/1.2 var(--mt-font)!important;letter-spacing:0!important;}',

    /* ================= ТЕЛЕФОН ================= */
    /* меню — на всю ширину екрана, прокручується всередині */
    '.mt-m #po-modal{left:8px!important;right:8px!important;top:calc(env(safe-area-inset-top,0px) + 56px)!important;width:auto!important;',
    'min-width:0!important;max-width:none!important;max-height:calc(100dvh - 150px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;}',
    '.mt-m #po-modal .po-toggle-row{min-height:40px;}',
    '.mt-m #po-modal .po-toggle-row > span:first-child{padding-right:12px;font-size:14px;}',
    '.mt-m #po-modal input{font-size:16px!important;}', /* без автозуму Safari */
    '#po-range-wrap [title^="Перетягніть"]{touch-action:none;}',
    '#po-range-wrap [title^="Перетягніть"]::before{content:"";position:absolute;left:-14px;right:-14px;top:-12px;bottom:-12px;}',
    '.mt-m #po-range-wrap [title^="Перетягніть"]{background:#fff!important;box-shadow:0 0 0 2px rgba(139,92,246,.7);}',

    /* верхні кнопки й велика плашка — на телефоні замінені панеллю збоку */
    '.mt-m #po-top-btns{display:none!important;}',
    '.mt-m #po-header-bar{display:none!important;}',
    '.mt-m #po-pin-btn,.mt-m #po-toggle-header{display:none!important;}',

    /* стек карток: усередині екрана, під рядком активу */
    '#mt-stack{position:fixed;left:62px;right:8px;z-index:99997;display:flex;flex-direction:column;gap:6px;',
    'max-height:38vh;overflow-y:auto;-webkit-overflow-scrolling:touch;pointer-events:none;overscroll-behavior:contain;}',
    '.mt-fold #mt-stack{left:8px;}',
    '#mt-stack.mt-empty{display:none!important;}',
    '#mt-stack.mt-hidden{display:none!important;}',
    '#mt-stack > *{pointer-events:auto;}',
    '#mt-stack-head{all:unset;box-sizing:border-box;align-self:flex-start;display:inline-flex;align-items:center;gap:6px;',
    'padding:5px 11px;border-radius:999px;background:rgba(22,15,43,.92);border:1px solid var(--mt-line);color:var(--mt-moon);',
    'font:700 11px/1.2 var(--mt-font);letter-spacing:.3px;text-transform:uppercase;cursor:pointer;touch-action:manipulation;',
    '-webkit-tap-highlight-color:transparent;position:fixed;z-index:99998;pointer-events:auto!important;}',
    '#mt-stack-head.mt-empty{display:none!important;}',
    '#mt-stack-head b{color:#fff;background:var(--mt-grad);border-radius:999px;padding:1px 7px;font-size:11px;}',
    '#mt-stack-head i{font-style:normal;color:var(--mt-muted);font-size:12px;}',
    '#mt-stack #po-scanner-list,#mt-stack #po-share-list,#mt-stack #po-alerts{position:static!important;left:auto!important;right:auto!important;',
    'top:auto!important;bottom:auto!important;transform:none!important;width:100%!important;min-width:0!important;max-width:none!important;',
    'margin:0!important;padding:0!important;align-items:stretch!important;gap:6px!important;}',
    '#mt-stack #po-scanner-list:empty,#mt-stack #po-share-list:empty,#mt-stack #po-alerts:empty{display:none!important;}',
    '#mt-stack li{min-width:0!important;max-width:none!important;width:auto!important;box-sizing:border-box!important;padding:8px 12px!important;}',
    '#mt-stack li > div{min-width:0;}',
    '#mt-stack li > div:last-child{overflow:hidden;text-overflow:ellipsis;}',
    '#mt-stack li span{flex-shrink:0;}',
    '#mt-stack li > div:last-child > span:first-child{flex-shrink:1;min-width:0;overflow:hidden;text-overflow:ellipsis;}',
    '#mt-stack li button[data-close]{font-size:18px!important;padding:2px 4px!important;margin:-4px -4px -4px 0;}',

    /* бейдж онлайну — переноситься в панель */
    '.mt-m #po-online-badge{display:none!important;}',

    /* бокова панель кнопок */
    '#mt-dock{position:fixed;left:calc(env(safe-area-inset-left,0px) + 6px);z-index:999990;display:flex;flex-direction:column;',
    'align-items:center;gap:5px;padding:5px;border-radius:20px;background:rgba(22,15,43,.82);border:1px solid var(--mt-line);',
    'box-shadow:0 10px 30px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);',
    'font-family:var(--mt-font);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
    '#mt-dock button{all:unset;box-sizing:border-box;width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center;',
    'color:var(--mt-ink);font:700 17px/1 var(--mt-font);background:rgba(139,92,246,.10);border:1px solid rgba(139,92,246,.18);',
    'cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '#mt-dock button:active{transform:scale(.92);background:rgba(139,92,246,.28);}',
    '#mt-dock button.mt-primary{background:var(--mt-grad);border-color:transparent;color:#fff;}',
    '#mt-dock button.mt-off{opacity:.45;}',
    '#mt-dock .mt-grip{width:26px;height:5px;border-radius:3px;background:var(--mt-line);margin:2px 0 1px;}',
    '#mt-dock .mt-online{font:700 10px/1.1 var(--mt-font);color:var(--mt-mint);text-align:center;padding:2px 0 1px;white-space:nowrap;}',
    '#mt-dock.mt-collapsed > :not(.mt-keep){display:none!important;}',
    '#mt-dock.mt-collapsed{padding:4px;border-radius:16px;opacity:.85;}',
    /* компактна панель для низьких екранів (iPhone SE тощо): дві колонки */
    '#mt-dock.mt-tight{display:grid;grid-template-columns:34px 34px;gap:4px;padding:5px;justify-items:center;}',
    '#mt-dock.mt-tight button{width:34px;height:34px;border-radius:11px;font-size:15px;}',
    '#mt-dock.mt-tight .mt-grip,#mt-dock.mt-tight .mt-online,#mt-dock.mt-tight [data-a="fold"]{grid-column:1 / span 2;}',
    '#mt-dock.mt-tight [data-a="fold"]{width:72px!important;height:24px!important;}',
    '#mt-dock.mt-tight.mt-collapsed{display:flex;}',
    'html.mt-tight-on:not(.mt-fold) #mt-stack{left:96px;}',

    /* меню інструментів (таймфрейми + малювання) */
    '#mt-tools{position:fixed;z-index:999991;display:none;width:252px;padding:10px;border-radius:18px;background:rgba(22,15,43,.97);',
    'border:1px solid var(--mt-line);box-shadow:0 14px 40px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);font-family:var(--mt-font);}',
    '#mt-tools.mt-open{display:block;}',
    '#mt-tools .mt-cap{font:700 10px/1 var(--mt-font);letter-spacing:.6px;text-transform:uppercase;color:var(--mt-muted);margin:2px 2px 8px;}',
    '#mt-tools .mt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;}',
    '#mt-tools .mt-grid.mt-draw{grid-template-columns:1fr 1fr;margin-bottom:2px;}',
    '#mt-tools [data-tf="all"]{grid-column:1 / -1;}',
    '#mt-tools button{all:unset;box-sizing:border-box;min-height:38px;padding:6px 8px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;',
    'color:var(--mt-ink);font:700 13px/1.15 var(--mt-font);text-align:center;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.2);',
    'touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;}',
    '#mt-tools button:active,#mt-tools button.mt-on{background:var(--mt-grad);border-color:transparent;color:#fff;}',
    '#mt-tools .mt-draw button{justify-content:flex-start;font-size:12px;white-space:nowrap;}',
    'html.mt-busy .ReactModal__Overlay{opacity:0!important;}',


    /* ===== Тема MoonTrade для сторінки торгівлі (html.mt-theme) ===== */
    '.mt-theme body,.mt-theme .wrapper,.mt-theme .m-main-wrap{background:var(--mt-night)!important;}',
    '.mt-theme .site-header{background:#120c27!important;border-bottom:1px solid var(--mt-line)!important;box-shadow:none!important;}',
    '.mt-theme .balance-info-block{font-family:var(--mt-font)!important;}',
    '.mt-theme .currencies-block__in,.mt-theme .items__link{background:rgba(22,15,43,.9)!important;border:1px solid var(--mt-line)!important;border-radius:14px!important;}',
    '.mt-theme .current-symbol{font-family:var(--mt-font)!important;font-weight:700!important;}',
    '.mt-theme .call-put-block{background:linear-gradient(180deg,rgba(28,21,66,.96),rgba(19,13,40,.98))!important;border:1px solid var(--mt-line)!important;',
    'border-radius:20px!important;box-shadow:0 -10px 30px rgba(0,0,0,.35)!important;}',
    '.mt-theme .call-put-block *{font-family:var(--mt-font)!important;}',
    '.mt-theme .call-put-block .block__title{color:var(--mt-muted)!important;font-weight:600!important;}',
    '.mt-theme .call-put-block .block__control{background:var(--mt-night)!important;border:1px solid var(--mt-line)!important;border-radius:14px!important;}',
    '.mt-theme .call-put-block .value__val{color:var(--mt-ink)!important;font-weight:700!important;}',
    '.mt-theme .block--payout .block__control{background:rgba(139,92,246,.08)!important;}',
    '.mt-theme .value__val-center{color:var(--mt-mint)!important;font-weight:800!important;}',
    '.mt-theme .value__val-end,.mt-theme .value__val-end span{color:var(--mt-moon)!important;}',
    '.mt-theme .btn-call,.mt-theme .btn-put{border-radius:16px!important;font-weight:800!important;letter-spacing:.4px;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 18px rgba(0,0,0,.3)!important;}',
    '.mt-theme .mobile-bottom-nav__list{background:#120c27!important;border-top:1px solid var(--mt-line)!important;}',
    '.mt-theme .mobile-bottom-nav__label{font-family:var(--mt-font)!important;font-weight:600!important;}',
    '.mt-theme .drop-down-modal,.mt-theme .ReactModal__Content{background:#160f2b!important;border:1px solid var(--mt-line)!important;border-radius:18px!important;}',
    '.mt-theme .dops__timeframes-item,.mt-theme .virtual-keyboard__input,.mt-theme .multiply__btn{border-radius:10px!important;}',
    /* сторінка «Угоди» */
    '.mt-theme .trades-modal{background:var(--mt-night)!important;font-family:var(--mt-font)!important;}',
    '.mt-theme .trades-modal *{font-family:var(--mt-font)!important;}',
    '.mt-theme .right-sidebar-modal__top-title{font-family:var(--mt-display)!important;font-size:18px!important;}',
    '.mt-theme .tab-nav-mobile-sidebar *{border-radius:999px!important;border-color:var(--mt-line)!important;}',
    '.mt-theme .tab-nav-mobile-sidebar .active,.mt-theme .tab-nav-mobile-sidebar .active > *{background:var(--mt-grad)!important;border-color:transparent!important;color:#fff!important;}',
    '.mt-theme .deals-list__group-label{color:var(--mt-muted)!important;font-weight:700!important;letter-spacing:.4px;background:transparent!important;}',
    '.mt-theme .deals-list__item{background:transparent!important;border:0!important;padding:3px 12px!important;}',
    '.mt-theme .deals-list__item-short{background:rgba(22,15,43,.92)!important;border:1px solid var(--mt-line)!important;border-radius:14px!important;padding:8px 12px!important;}',
    '.mt-theme .more-btn .btn{background:var(--mt-grad)!important;border:0!important;border-radius:999px!important;}',

    /* ===== Чистий інтерфейс (html.mt-clean) ===== */
    '.mt-clean [data-mt-x],.mt-clean .mobile-bottom-nav__center,.mt-clean .info-icons,.mt-clean .mobile-bottom-nav__cell--more{display:none!important;}',
    'html:not(.mt-clean) [data-mt-add]{display:none!important;}',
    /* компактне нижнє меню в один рядок: більше місця для графіка */
    'html.mt-clean .is-chart.portrait .mobile-bottom-nav,html.mt-clean body:not(.is-chart) .mobile-bottom-nav{height:calc(44px + max(8px,env(safe-area-inset-bottom,0px)))!important;}',
    'html.mt-clean .mobile-bottom-nav__list{height:100%!important;min-height:0!important;padding:2px 10px max(8px,env(safe-area-inset-bottom,0px))!important;box-sizing:border-box!important;}',
    'html.mt-clean .mobile-bottom-nav__cell{height:40px!important;flex:1 1 0!important;max-width:none!important;}',
    'html.mt-clean .mobile-bottom-nav__item{height:40px!important;width:100%!important;padding:0!important;}',
    'html.mt-clean .mobile-bottom-nav__item-in{flex-direction:row!important;gap:8px!important;align-items:center!important;justify-content:center!important;height:40px!important;padding:0!important;}',
    'html.mt-clean .mobile-bottom-nav__label{margin:0!important;font-size:13px!important;line-height:1!important;}',
    'html.mt-clean .mobile-bottom-nav__item-in svg{width:20px!important;height:20px!important;margin:0!important;}',
    'html.mt-clean .chart-container{height:auto!important;top:0!important;bottom:var(--mt-nav,70px)!important;}',
    'html.mt-clean .call-put-wrap{padding-bottom:calc(var(--mt-nav,70px) + 20px)!important;}',
    /* меню «Більше» і меню профілю в стилі MoonTrade (вкладені сторінки лишаються як у PO) */
    '.mt-theme .mobile-bottom-nav__more-panel{background:#160f2b!important;border:1px solid var(--mt-line)!important;border-radius:18px!important;}',
    '.mt-theme .mobile-bottom-nav__more-panel *{font-family:var(--mt-font)!important;}',
    '.mt-theme .profile-menu__panel{background:var(--mt-night)!important;font-family:var(--mt-font)!important;}',
    '.mt-theme .profile-menu__panel *{font-family:var(--mt-font)!important;}',
    '.mt-theme .profile-menu__status-bg{background:radial-gradient(260px 340px at 0 0,rgba(139,92,246,.35),transparent 70%)!important;}',
    '.mt-theme .profile-menu__menu{background:#130d28!important;border-top:1px solid var(--mt-line)!important;}',
    '.mt-theme .profile-menu__card,.mt-theme .profile-menu__chip,.mt-theme .profile-menu__lang{background:rgba(22,15,43,.95)!important;border:1px solid var(--mt-line)!important;border-radius:16px!important;}',
    '.mt-theme .profile-menu__row-inner{border-color:var(--mt-line)!important;}',
    '.mt-theme .profile-menu__head-btn,.mt-theme .profile-menu__withdrawal-btn{background:rgba(139,92,246,.14)!important;border-radius:12px!important;}',
    '.mt-theme .profile-menu__deposit-btn{border-radius:12px!important;}',
    /* вікна «Час» і «Сума» не заходять на поля */
    '[data-mt-shift]{translate:0 var(--mt-shift,0px)!important;}',
    '.mt-clean .value__val-start{display:none!important;}',

    /* наші елементи не перекривають «Угоди» та інші бокові екрани PO */
    'html.mt-sheet #mt-dock,html.mt-sheet #mt-stack,html.mt-sheet #mt-stack-head,html.mt-sheet #mt-tools{display:none!important;}',
    'html.mt-pop #mt-dock,html.mt-pop #mt-stack,html.mt-pop #mt-stack-head,html.mt-pop #mt-tools{display:none!important;}',

    /* швидкий час і множник суми */
    /* кнопка множника всередині поля «Сума» */
    '#mt-kchip{all:unset;box-sizing:border-box;align-self:center;flex-shrink:0;height:28px;padding:0 10px;margin-right:4px;border-radius:9px;',
    'background:var(--mt-grad);color:#fff;font:800 12px/28px var(--mt-font);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '#mt-kchip:active{transform:scale(.94);}',

    /* підсумок на «Угодах» */
    '#mt-sum{margin:8px 12px 4px;padding:10px 12px;border-radius:16px;background:linear-gradient(135deg,rgba(109,61,240,.22),rgba(22,15,43,.95));',
    'border:1px solid var(--mt-line);font-family:var(--mt-font);color:var(--mt-ink);}',
    '#mt-sum .mt-t{font:700 10px/1 var(--mt-font);letter-spacing:.6px;text-transform:uppercase;color:var(--mt-muted);margin-bottom:8px;}',
    '#mt-sum .mt-g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}',
    '#mt-sum .mt-v{font:800 16px/1.1 var(--mt-font);}',
    '#mt-sum .mt-l{font:600 10px/1.2 var(--mt-font);color:var(--mt-muted);margin-top:2px;}',
    '#mt-sum .mt-up{color:var(--mt-mint);} #mt-sum .mt-dn{color:var(--mt-rose);}',

    /* блок MoonTrade в налаштуваннях моду */
    '#mt-set{padding:12px 16px 4px;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid var(--mt-line);}',
    '#mt-set .mt-h{color:var(--mt-violet);font:700 11px/1 var(--mt-font);letter-spacing:.6px;text-transform:uppercase;}',
    '#mt-set label{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:36px;cursor:pointer;color:var(--mt-ink);font:600 14px/1.25 var(--mt-font);}',
    '#mt-set label small{display:block;color:var(--mt-muted);font:500 11px/1.3 var(--mt-font);margin-top:2px;}',
    '#mt-set .mt-sw{flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#2c2554;position:relative;transition:.2s;}',
    '#mt-set .mt-sw::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s;}',
    '#mt-set .mt-sw.on{background:var(--mt-grad);}',
    '#mt-set .mt-sw.on::after{left:21px;}',
    '#mt-set input{width:72px;text-align:center;}',

    /* ================= ПК ================= */
    /* кнопки моду «Надіслати / МОД» і бейдж онлайну — тепер у панелі MoonTrade */
    '.mt-pc #po-online-badge{display:none!important;}',
    '.mt-pc #po-top-btns{visibility:hidden!important;pointer-events:none!important;}',
    '.mt-pc #mt-kchip{height:24px;padding:0 7px;margin-right:2px;font-size:11px;line-height:24px;}',
    '#mt-bar{position:fixed;left:-9999px;top:70px;z-index:11;display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:4px 6px;border-radius:14px;',
    'background:rgba(22,15,43,.94);border:1px solid var(--mt-line);box-shadow:0 10px 30px rgba(0,0,0,.45);',
    '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);font-family:var(--mt-font);-webkit-user-select:none;user-select:none;}',
    '#mt-bar .mt-grip{width:10px;height:26px;margin:0 2px;cursor:grab;border-radius:4px;opacity:.75;',
    'background:radial-gradient(circle,var(--mt-muted) 1.2px,transparent 1.6px) 0 0/5px 5px;}',
    '#mt-bar button{all:unset;box-sizing:border-box;height:30px;min-width:30px;padding:0 8px;border-radius:9px;display:flex;align-items:center;justify-content:center;',
    'color:var(--mt-ink);font:700 12px/1 var(--mt-font);background:rgba(139,92,246,.10);border:1px solid rgba(139,92,246,.18);cursor:pointer;white-space:nowrap;transition:background .15s;}',
    '#mt-bar button:hover{background:rgba(139,92,246,.26);}',
    '#mt-bar button:active{transform:scale(.94);}',
    '#mt-bar button.mt-on,#mt-bar button.mt-primary{background:var(--mt-grad);color:#fff;border-color:transparent;}',
    '#mt-bar button.mt-off{opacity:.5;}',
    '#mt-bar .mt-sep{width:1px;height:22px;background:var(--mt-line);margin:0 3px;}',
    '#mt-bar .mt-grp{display:flex;align-items:center;gap:4px;}',
    '#mt-bar .mt-st{display:flex;align-items:center;gap:6px;font:700 11px/1 var(--mt-font);color:var(--mt-muted);padding:0 4px 0 2px;white-space:nowrap;}',
    '#mt-bar .mt-dot{width:8px;height:8px;border-radius:50%;background:var(--mt-rose);box-shadow:0 0 6px var(--mt-rose);}',
    '#mt-bar .mt-dot.on{background:var(--mt-mint);box-shadow:0 0 6px var(--mt-mint);}',
    'html.mt-dragging,html.mt-dragging *{cursor:grabbing!important;}',

    /* меню моду: вкладки */
    '.mt-pc #po-modal{max-height:calc(100vh - 80px)!important;overflow-y:auto!important;max-width:430px!important;}',
    '#mt-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px 4px;}',
    '#mt-tabs button{all:unset;cursor:pointer;padding:7px 12px;border-radius:999px;font:700 12px/1 var(--mt-font);color:var(--mt-muted);',
    'background:rgba(139,92,246,.08);border:1px solid var(--mt-line);}',
    '#mt-tabs button:hover{color:var(--mt-ink);}',
    '#mt-tabs button.on{background:var(--mt-grad);color:#fff;border-color:transparent;}',
    '#po-modal[data-mt-cur="sig"] [data-mt-tab]:not([data-mt-tab="sig"]),#po-modal[data-mt-cur="pay"] [data-mt-tab]:not([data-mt-tab="pay"]),',
    '#po-modal[data-mt-cur="ui"] [data-mt-tab]:not([data-mt-tab="ui"]),#po-modal[data-mt-cur="snd"] [data-mt-tab]:not([data-mt-tab="snd"]),',
    '#po-modal[data-mt-cur="keys"] [data-mt-tab]:not([data-mt-tab="keys"]){display:none!important;}',
    '.mt-pc #mt-set{border-bottom:0;}',
    '.mt-pane{padding:12px 16px 8px;display:flex;flex-direction:column;gap:10px;font-family:var(--mt-font);color:var(--mt-ink);}',
    '.mt-pane .mt-h,#mt-set .mt-h{color:var(--mt-violet);font:700 11px/1 var(--mt-font);letter-spacing:.6px;text-transform:uppercase;}',
    '.mt-pane label{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:34px;cursor:pointer;font:600 14px/1.25 var(--mt-font);}',
    '.mt-pane label small,.mt-btnrow small{display:block;color:var(--mt-muted);font:500 11px/1.3 var(--mt-font);margin-top:2px;}',
    '.mt-pane .mt-sw{flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#2c2554;position:relative;transition:.2s;}',
    '.mt-pane .mt-sw::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s;}',
    '.mt-pane .mt-sw.on{background:var(--mt-grad);}',
    '.mt-pane .mt-sw.on::after{left:21px;}',
    '.mt-vol{display:flex;align-items:center;gap:12px;font:600 14px/1 var(--mt-font);}',
    '.mt-vol input{flex:1;accent-color:#8b5cf6;}',
    '.mt-vol b{min-width:40px;text-align:right;color:var(--mt-moon);font-size:13px;}',
    '.mt-btnrow{display:flex;align-items:center;justify-content:space-between;gap:12px;font:600 14px/1.25 var(--mt-font);color:var(--mt-ink);min-height:34px;}',
    '.mt-btnrow button{all:unset;cursor:pointer;padding:7px 12px;border-radius:999px;font:700 12px/1 var(--mt-font);color:var(--mt-moon);',
    'background:rgba(139,92,246,.10);border:1px solid var(--mt-line);white-space:nowrap;}',
    '.mt-btnrow button:hover{background:rgba(139,92,246,.24);}',
    '.mt-note{color:var(--mt-muted);font:500 12px/1.4 var(--mt-font);}',
    '.mt-k{display:flex;align-items:center;gap:8px;font:600 13px/1.2 var(--mt-font);min-height:30px;}',
    '.mt-k > span{flex:1;}',
    '.mt-k.mt-ch > span{color:var(--mt-moon);}',
    '.mt-kb{all:unset;cursor:pointer;min-width:74px;text-align:center;padding:6px 10px;border-radius:8px;font:700 12px/1 var(--mt-font);',
    'color:var(--mt-ink);background:var(--mt-night);border:1px solid var(--mt-line);box-shadow:inset 0 -2px 0 rgba(139,92,246,.25);}',
    '.mt-kb:hover{border-color:var(--mt-violet);}',
    '.mt-kb.mt-wait{background:var(--mt-grad);color:#fff;border-color:transparent;}',
    '.mt-kr{all:unset;cursor:pointer;width:24px;text-align:center;color:var(--mt-muted);font-size:14px;}',
    '.mt-kr[disabled]{opacity:.25;cursor:default;}',

    /* чистий інтерфейс на ПК */
    '.mt-pclean .left-sidebar{display:none!important;}',
    '.mt-pclean .right-sidebar [data-mt-x]{display:none!important;}',
    'html:not(.mt-pclean) .right-sidebar [data-mt-add]{display:none!important;}',
    '.right-sidebar [data-mt-add] a{position:relative;cursor:pointer;}',
    '.right-sidebar .mt-badge{position:absolute;top:6px;right:18px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:8px;',
    'background:#2f7ef5;color:#fff;font:700 10px/16px var(--mt-font);font-style:normal;text-align:center;}',

    /* стиль MoonTrade на ПК */
    '.mt-ptheme body,.mt-ptheme .wrapper{background:var(--mt-night)!important;}',
    '.mt-ptheme .site-header{background:#120c27!important;border-bottom:1px solid var(--mt-line)!important;box-shadow:none!important;}',
    '.mt-ptheme .site-header *{font-family:var(--mt-font)!important;}',
    '.mt-ptheme .left-sidebar,.mt-ptheme .right-sidebar{background:#120c27!important;border-color:var(--mt-line)!important;}',
    '.mt-ptheme .right-sidebar .nlabel,.mt-ptheme .left-sidebar a{font-family:var(--mt-font)!important;font-weight:600!important;}',
    '.mt-ptheme .right-sidebar li.active > a,.mt-ptheme .right-sidebar li > a:hover{color:var(--mt-moon)!important;}',
    '.mt-ptheme .call-put-block{background:linear-gradient(180deg,#1a1440,#120c27)!important;border-left:1px solid var(--mt-line)!important;}',
    '.mt-ptheme .call-put-block *{font-family:var(--mt-font)!important;}',
    '.mt-ptheme .call-put-block .block__title{color:var(--mt-muted)!important;font-weight:600!important;}',
    '.mt-ptheme .call-put-block .block__control{background:var(--mt-night)!important;border:1px solid var(--mt-line)!important;border-radius:12px!important;}',
    '.mt-ptheme .call-put-block .value__val{color:var(--mt-ink)!important;font-weight:700!important;}',
    '.mt-ptheme .block--payout .block__control{background:rgba(139,92,246,.08)!important;}',
    '.mt-ptheme .block--payout .value__val-start{color:var(--mt-mint)!important;font-weight:800!important;}',
    '.mt-ptheme .btn-call,.mt-ptheme .btn-put{border-radius:14px!important;font-weight:800!important;letter-spacing:.4px;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 18px rgba(0,0,0,.3)!important;}',
    '.mt-ptheme .widget-slot{background:#120c27!important;border-color:var(--mt-line)!important;}',
    '.mt-ptheme .widget-slot *{font-family:var(--mt-font)!important;}',
    '.mt-ptheme .widget-slot__header{background:#160f2b!important;border-color:var(--mt-line)!important;}',
    '.mt-ptheme .widget-slot__header .divider li a{border-radius:999px!important;}',
    '.mt-ptheme .widget-slot__header .divider li.active a{background:var(--mt-grad)!important;color:#fff!important;}',
    '.mt-ptheme .deals-list__group-label{color:var(--mt-muted)!important;font-weight:700!important;letter-spacing:.4px;}',
    '.mt-ptheme .deals-list__item{border-color:var(--mt-line)!important;}',
    '.mt-ptheme .deals-list__item:hover{background:rgba(139,92,246,.08)!important;}',
    '.mt-ptheme .top-left-block .items__link,.mt-ptheme .top-left-block .currencies-block__in{background:rgba(22,15,43,.92)!important;border:1px solid var(--mt-line)!important;border-radius:10px!important;}',
    '.mt-ptheme .drop-down-modal{background:#160f2b!important;border:1px solid var(--mt-line)!important;border-radius:14px!important;}',
    '.mt-ptheme .drop-down-modal *{font-family:var(--mt-font)!important;}',
    '.mt-ptheme .h-btn--deposit{border-radius:12px!important;}',
    '.mt-ptheme .widget-slot #mt-sum{margin:8px 10px 6px;}'
  ].join('');

  var st = document.createElement('style');
  st.id = 'mt-style';
  st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);
  if (MOBILE) document.documentElement.classList.add('mt-m');

  // ---------- допоміжне ----------
  function $(id) { return document.getElementById(id); }
  function key(k, code, kc) {
    var ev = new KeyboardEvent('keydown', { key: k, code: code, keyCode: kc, which: kc, bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    setTimeout(function () {
      document.dispatchEvent(new KeyboardEvent('keyup', { key: k, code: code, keyCode: kc, which: kc, bubbles: true }));
    }, 30);
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---------- мобільна частина ----------
  function setupMobile() {
    if (!MOBILE || $('mt-dock')) return;

    // стек карток
    var stack = el('div', { id: 'mt-stack', 'class': 'mt-empty' });
    var head = el('button', { id: 'mt-stack-head', type: 'button', 'class': 'mt-empty' }, 'Сигнали <b id="mt-stack-n">0</b> <i id="mt-stack-arrow">▴</i>');
    document.documentElement.appendChild(stack);
    document.documentElement.appendChild(head);
    function syncHead() {
      var hidden = stack.classList.contains('mt-hidden');
      var a = $('mt-stack-arrow');
      if (a) a.textContent = hidden ? '▾ показати' : '▴';
    }
    if (lsGet('hideCards', false)) stack.classList.add('mt-hidden');
    syncHead();
    head.addEventListener('click', function () {
      stack.classList.toggle('mt-hidden');
      lsSet('hideCards', stack.classList.contains('mt-hidden'));
      syncHead();
    });

    // панель кнопок
    var dock = el('div', { id: 'mt-dock' });
    dock.innerHTML =
      '<div class="mt-grip mt-keep" title="Перетягніть"></div>' +
      '<button data-a="up" aria-label="Попередній актив">▲</button>' +
      '<button data-a="down" aria-label="Наступний актив">▼</button>' +
      '<button data-a="tools" aria-label="Таймфрейм і малювання">⋯</button>' +
      '<button data-a="send" class="mt-primary" aria-label="Надіслати угоду">📣</button>' +
      '<button data-a="mod" aria-label="Налаштування моду">☰</button>' +
      '<div class="mt-online" id="mt-online">—</div>' +
      '<button data-a="fold" class="mt-keep" aria-label="Згорнути панель" style="height:28px">‹</button>';
    document.documentElement.appendChild(dock);

    var tools = el('div', { id: 'mt-tools' });
    var TF = ['M1', 'M2', 'M3', 'M5', 'M10', 'M15'];
    var DR = [['Горизонтальна лінія', '— Горизонт.'], ['Лінія Тренда', '╱ Тренд'], ['Прямокутник', '▭ Прямокутник'],
              ['Лінії Фібоначчі', '☰ Фібоначчі'], ['Промінь', '↗ Промінь'], ['__list', '✎ Усі побудови']];
    tools.innerHTML = '<div class="mt-cap">Таймфрейм</div><div class="mt-grid">' +
      TF.map(function (t) { return '<button data-tf="' + t + '">' + t + '</button>'; }).join('') +
      '<button data-tf="all">Усі ТФ</button>' +
      '</div><div class="mt-cap">Малювання</div><div class="mt-grid mt-draw">' +
      DR.map(function (d) { return '<button data-dr="' + d[0] + '">' + d[1] + '</button>'; }).join('') + '</div>';
    document.documentElement.appendChild(tools);
    function markTF(t) {
      tools.querySelectorAll('[data-tf]').forEach(function (b) { b.classList.toggle('mt-on', b.getAttribute('data-tf') === t); });
    }
    markTF(lsGet('tf', null));
    tools.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      e.stopPropagation();
      tools.classList.remove('mt-open');
      var t = b.getAttribute('data-tf'), d = b.getAttribute('data-dr');
      if (t === 'all') poShowAllTF();
      else if (t) poSetTF(t).then(function (ok) { if (ok) { lsSet('tf', t); markTF(t); } });
      else if (d) poDraw(d);
    });
    document.addEventListener('touchstart', function (e) {
      if (!tools.classList.contains('mt-open')) return;
      if (!tools.contains(e.target) && !e.target.closest('#mt-dock')) tools.classList.remove('mt-open');
    }, { passive: true });
    document.addEventListener('mousedown', function (e) {
      if (!tools.classList.contains('mt-open')) return;
      if (!tools.contains(e.target) && !e.target.closest('#mt-dock')) tools.classList.remove('mt-open');
    });

    function setFold(f) {
      dock.classList.toggle('mt-collapsed', f);
      document.documentElement.classList.toggle('mt-fold', f);
      var b = dock.querySelector('[data-a="fold"]');
      if (b) b.textContent = f ? '›' : '‹';
      lsSet('fold', f);
      tools.classList.remove('mt-open');
    }
    setFold(!!lsGet('fold', false));

    dock.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a !== 'tools') tools.classList.remove('mt-open');
      if (a === 'tools') {
        e.stopPropagation();
        var r = b.getBoundingClientRect();
        tools.style.left = (r.right + 8) + 'px';
        tools.classList.toggle('mt-open');
        var th = tools.offsetHeight || 260;
        tools.style.top = Math.max(8, Math.min(window.innerHeight - th - 8, r.top - th / 2 + r.height / 2)) + 'px';
      }
      else if (a === 'up') key('ArrowUp', 'ArrowUp', 38);
      else if (a === 'down') key('ArrowDown', 'ArrowDown', 40);
      else if (a === 'send' || a === 'mod') {
        // окремим кліком після поточного, щоб мод не прийняв його за «клік поза меню»
        e.stopPropagation();
        var target = $(a === 'send' ? 'po-send-btn' : 'po-settings-btn');
        if (target) setTimeout(function () { target.click(); }, 0);
      }
      else if (a === 'fold') setFold(!dock.classList.contains('mt-collapsed'));
    });
    // перетягування панелі по вертикалі (за смужку зверху)
    var grip = dock.querySelector('.mt-grip');
    var dragY = null, startTop = 0;
    grip.addEventListener('touchstart', function (e) { dragY = e.touches[0].clientY; startTop = dock.getBoundingClientRect().top; }, { passive: true });
    grip.addEventListener('touchmove', function (e) { if (dragY === null) return; e.preventDefault(); placeDock(startTop + e.touches[0].clientY - dragY); }, { passive: false });
    grip.addEventListener('touchend', function () { if (dragY === null) return; dragY = null; lsSet('dockTop', Math.round(dock.getBoundingClientRect().top)); });
    window.addEventListener('resize', function () { layout(); });
  }

  // ---------- керування графіком через інтерфейс PO (на мобільному гарячі клавіші моду не працюють) ----------
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function visible(sel) { var n = document.querySelector(sel); return !!(n && n.getBoundingClientRect().height > 0); }
  function poEsc() {
    var c = document.querySelector('.ReactModal__Content');
    if (c) c.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
  }
  function poOpenMenu(linkSel) {
    var p = Promise.resolve();
    if (!visible(linkSel)) {
      var dots = document.querySelector('.items__link--dots');
      if (!dots) return Promise.resolve(false);
      dots.click();
      p = wait(300);
    }
    return p.then(function () {
      var l = document.querySelector(linkSel);
      if (!l) return false;
      l.click();
      return wait(450).then(function () { return true; });
    });
  }
  function busy(on) { document.documentElement.classList.toggle('mt-busy', on); }
  function poSetTF(t) {
    busy(true);
    return poOpenMenu('.items__link--chart-type').then(function (ok) {
      if (!ok) return false;
      var nav = [].slice.call(document.querySelectorAll('.chart-settings-modal__nav-link'))
        .filter(function (e) { return /Інтервал|Interval|Интервал/i.test(e.textContent); })[0];
      if (nav) nav.click();
      return wait(350).then(function () {
        var l = [].slice.call(document.querySelectorAll('.interval-list__link'))
          .filter(function (a) { return a.textContent.trim() === t; })[0];
        if (l) l.click();
        return wait(350).then(function () { poEsc(); return !!l; });
      });
    }).then(function (r) { return wait(250).then(function () { busy(false); return r; }); },
            function () { busy(false); return false; });
  }
  // «Усі ТФ»: відкриваємо повний список інтервалів PO і лишаємо його відкритим для вибору
  function poShowAllTF() {
    return poOpenMenu('.items__link--chart-type').then(function (ok) {
      if (!ok) return;
      var nav = [].slice.call(document.querySelectorAll('.chart-settings-modal__nav-link'))
        .filter(function (e) { return /Інтервал|Interval|Интервал/i.test(e.textContent); })[0];
      if (nav) nav.click();
    });
  }
  function poDraw(name) {
    if (name === '__list') return poOpenMenu('.items__link--drawings');
    busy(true);
    return poOpenMenu('.items__link--drawings').then(function (ok) {
      if (!ok) return;
      var c = document.querySelector('.ReactModal__Content');
      var all = c && [].slice.call(c.querySelectorAll('*')).filter(function (e) { return e.children.length === 0 && /^(Все|All|Всё)$/.test(e.textContent.trim()); })[0];
      if (all) (all.closest('a,li,button') || all).click();
      return wait(300).then(function () {
        var it = [].slice.call(document.querySelectorAll('.drawings-modal__item-info'))
          .filter(function (e) { return e.textContent.trim() === name; })[0];
        if (it) it.click();
        return wait(300).then(function () { if (document.querySelector('.ReactModal__Content.DrawingsList')) poEsc(); });
      });
    }).then(function () { return wait(250).then(function () { busy(false); }); }, function () { busy(false); });
  }

  // ---------- налаштування MoonTrade (зберігаються на пристрої) ----------
  var OPT = { theme: lsGet('theme', true), clean: lsGet('clean', true) };
  function applyOpts() {
    var h = document.documentElement;
    // телефон і ПК мають різну розмітку PO, тому окремі класи
    h.classList.toggle('mt-theme', MOBILE && !!OPT.theme);
    h.classList.toggle('mt-clean', MOBILE && !!OPT.clean);
    h.classList.toggle('mt-ptheme', !MOBILE && !!OPT.theme);
    h.classList.toggle('mt-pclean', !MOBILE && !!OPT.clean);
  }
  applyOpts();

  function fmtK(k) { return (Math.round(k * 100) / 100).toString(); }

  function syncSettings() {
    var md = $('po-modal');
    if (!md) return;
    var box = $('mt-set');
    if (!box) {
      box = el('div', { id: 'mt-set' });
      box.innerHTML =
        '<div class="mt-h">MoonTrade</div>' +
        '<label data-o="theme"><span>Стиль MoonTrade<small>Оформлення сторінки торгівлі та «Угод»</small></span><span class="mt-sw"></span></label>' +
        '<label data-o="clean"><span>Чистий інтерфейс<small>Сховати зайві кнопки PO</small></span><span class="mt-sw"></span></label>';
      var first = md.firstElementChild;
      md.insertBefore(box, first ? first.nextSibling : null);
      box.addEventListener('click', function (e) {
        var lb = e.target.closest('label[data-o]');
        if (!lb) return;
        e.preventDefault(); e.stopPropagation();
        var o = lb.getAttribute('data-o');
        OPT[o] = !OPT[o]; lsSet(o, OPT[o]); applyOpts(); paintSettings();
      });
    }
    paintSettings();
  }
  function paintSettings() {
    var box = $('mt-set');
    if (!box) return;
    box.querySelectorAll('label[data-o]').forEach(function (lb) {
      lb.querySelector('.mt-sw').classList.toggle('on', !!OPT[lb.getAttribute('data-o')]);
    });
  }

  // ---------- чистий інтерфейс: позначаємо зайві елементи PO ----------
  function markClutter() {
    [].slice.call(document.querySelectorAll('.mobile-bottom-nav__cell')).forEach(function (li) {
      var lb = li.querySelector('.mobile-bottom-nav__label');
      var t = ((lb && lb.textContent) || '').replace(/\s+/g, ' ').trim();
      if (/^(Сигнали|Signals|Сигналы)$/i.test(t) || /^(Соціальна|Social|Социальная)/i.test(t)) li.setAttribute('data-mt-x', '1');
    });
    [].slice.call(document.documentElement.children).forEach(function (n) {
      if (n.tagName === 'DIV' && !n.id && n.children.length === 0 && /^PO\s*(ON|OFF)$/i.test((n.textContent || '').trim())) n.setAttribute('data-mt-x', '1');
    });
    var list = document.querySelector('.mobile-bottom-nav__list');
    var src = document.querySelector('.mobile-bottom-nav__more-cell [data-modal-id="pending-orders-modal"]');
    if (list && src && !list.querySelector('[data-mt-add="pending"]')) {
      var li = el('li', { 'class': 'mobile-bottom-nav__cell', 'data-mt-add': 'pending' });
      li.appendChild(src.cloneNode(true));
      var more = list.querySelector('.mobile-bottom-nav__cell--more');
      list.insertBefore(li, more || null);
    }
  }

  // ---------- множник суми (×k з калькулятора PO) ----------
  function expToggle() { var c = document.querySelector('.block--expiration-inputs .control__value'); if (c) c.click(); }
  function amtToggle() { var c = document.querySelector('.block--bet-amount .control__value'); if (c) c.click(); }
  function curAmount() {
    var v = document.querySelector('.block--bet-amount .value__val');
    var n = v && parseFloat((v.textContent || '').replace(/[^\d.]/g, ''));
    return n > 0 ? n : null;
  }
  // множник суми: натискаємо «×» у вікні «Сума» PO з коефіцієнтом, який там виставлено
  function readPoK() {
    var f = document.querySelector('.amount-list-modal .multiply-field');
    var v = f && parseFloat(String(f.value).replace(',', '.'));
    if (v > 0) { lsSet('poK', v); return v; }
    return lsGet('poK', 2);
  }
  function multiplyAmount() {
    if (document.querySelector('.amount-list-modal')) amtToggle();
    wait(150).then(function () { amtToggle(); return wait(400); }).then(function () {
      readPoK();
      var btn = document.querySelectorAll('.amount-list-modal .multiply__btn')[0];
      if (btn) btn.click();
      return wait(250);
    }).then(function () { if (document.querySelector('.amount-list-modal')) amtToggle(); paintQuick(); });
  }
  function paintQuick() { var b = $('mt-kchip'); if (b) b.textContent = '×' + fmtK(lsGet('poK', 2)); }
  function syncQuick() {
    var ctrl = document.querySelector('.block--bet-amount .block__control');
    if (!ctrl) return;
    var chip = $('mt-kchip');
    if (!chip) {
      chip = el('button', { id: 'mt-kchip', type: 'button', 'aria-label': 'Помножити суму' }, '×2');
      chip.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); multiplyAmount(); });
    }
    var wrap = ctrl.querySelector('.control-buttons__wrapper');
    if (chip.parentNode !== ctrl) ctrl.insertBefore(chip, wrap || null);
    paintQuick();
  }
  function syncPopups() {
    var h = document.documentElement;
    var shown = function (sel) {
      return [].slice.call(document.querySelectorAll(sel)).some(function (e) {
        var cs = getComputedStyle(e), r = e.getBoundingClientRect();
        return cs.visibility !== 'hidden' && cs.display !== 'none' && r.height > 0 && r.width > 0;
      });
    };
    var pop = shown('.drop-down-modal') ||
      !!document.querySelector('.profile-menu--active') ||
      !!document.querySelector('.mobile-bottom-nav__more-panel.is-open') ||
      !!document.querySelector('.ReactModal__Content');
    if (!h.classList.contains('mt-busy')) h.classList.toggle('mt-pop', pop);
    if (document.querySelector('.amount-list-modal .multiply-field')) { readPoK(); paintQuick(); }
    // висота компактного нижнього меню -> відступи графіка і блоку угоди
    var navEl = document.querySelector('.mobile-bottom-nav');
    if (navEl) {
      var nh = Math.round(navEl.getBoundingClientRect().height) + 'px';
      if (h.style.getPropertyValue('--mt-nav') !== nh) { h.style.setProperty('--mt-nav', nh); setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50); }
    }
    [['.expiration-inputs-list-modal', '.block--expiration-inputs'], ['.amount-list-modal', '.block--bet-amount']].forEach(function (p) {
      var m = document.querySelector(p[0]), f = document.querySelector(p[1]);
      if (!m || !f) return;
      m.style.setProperty('--mt-shift', '0px');
      var over = m.getBoundingClientRect().bottom - (f.getBoundingClientRect().top - 6);
      if (over > 0) { m.setAttribute('data-mt-shift', '1'); m.style.setProperty('--mt-shift', (-Math.ceil(over)) + 'px'); }
    });
  }
  function money(t) { var m = String(t || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; }
  function syncTrades() {
    var modal = document.querySelector('.trades-modal');
    var open = !!(modal && modal.getBoundingClientRect().height > 0);
    var sheet = [].slice.call(document.querySelectorAll('.right-sidebar-modal')).some(function (m) { return m.getBoundingClientRect().height > 0; });
    document.documentElement.classList.toggle('mt-sheet', open || sheet);
    var sum = $('mt-sum');
    if (!open || !OPT.theme) { if (sum) sum.remove(); return; }
    var list = modal.querySelector('.deals-list');
    var closedTab = modal.querySelector('.tab-nav-mobile-sidebar .active');
    if (!list || !closedTab || !/Закриті|Closed|Закрытые/i.test(closedTab.textContent)) { if (sum) sum.remove(); return; }
    var html = todayHtml(list);
    if (!sum) {
      sum = el('div', { id: 'mt-sum' });
      list.parentNode.insertBefore(sum, list);
    }
    if (sum.getAttribute('data-h') !== html) { sum.innerHTML = html; sum.setAttribute('data-h', html); }
  }

  function todayHtml(list) {
    var d = new Date(), today = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var n = 0, w = 0, l = 0, pl = 0, inToday = false;
    [].slice.call(list.children).forEach(function (c) {
      if (/group-label/.test(c.className)) { inToday = (c.textContent || '').trim() === today; return; }
      if (!inToday) return;
      [].slice.call(c.classList.contains('deals-list__item') ? [c] : c.querySelectorAll('.deals-list__item')).forEach(function (it) {
        var vals = ((it.innerText || '').match(/[+-]?\$[\d,]+(\.\d+)?/g) || []);
        if (vals.length < 2) return;
        var stake = money(vals[0]), pay = money(vals[1]);
        n++; pl += pay - stake;
        if (pay > stake) w++; else if (pay < stake) l++;
      });
    });
    var wr = (w + l) ? Math.round(w / (w + l) * 100) : 0;
    var plTxt = (pl >= 0 ? '+$' : '−$') + Math.abs(Math.round(pl * 100) / 100).toLocaleString('en-US');
    var html = '<div class="mt-t">Сьогодні</div><div class="mt-g">' +
      '<div><div class="mt-v">' + n + '</div><div class="mt-l">угод</div></div>' +
      '<div><div class="mt-v"><span class="mt-up">' + w + '</span> / <span class="mt-dn">' + l + '</span></div><div class="mt-l">плюс / мінус</div></div>' +
      '<div><div class="mt-v">' + wr + '%</div><div class="mt-l">вінрейт</div></div>' +
      '<div><div class="mt-v ' + (pl >= 0 ? 'mt-up' : 'mt-dn') + '">' + plTxt + '</div><div class="mt-l">результат</div></div></div>';
    return html;
  }

  // зона графіка: від рядка з активом до блоку угоди (Час / Сума / Купити)
  function zone() {
    var top = 0, bottom = 0;
    var sym = document.querySelector('.current-symbol');
    if (sym) {
      var box = sym.closest('.currencies-block__in, .pair-number-wrap, .pair') || sym;
      top = box.getBoundingClientRect().bottom;
    }
    var clk = document.querySelector('.current-time');
    if (clk) { var cr = clk.getBoundingClientRect(); if (cr.height > 0 && cr.bottom > top && cr.bottom < window.innerHeight * 0.4) top = cr.bottom; }
    if (!(top > 30 && top < window.innerHeight * 0.5)) top = 116;
    var w = document.querySelector('.buttons__wrap');
    if (w) {
      var n = w;
      while (n && n.parentElement) {
        var r = n.parentElement.getBoundingClientRect();
        if (r.height > window.innerHeight * 0.5) break;
        n = n.parentElement;
      }
      bottom = n.getBoundingClientRect().top;
    }
    if (!(bottom > top + 150)) bottom = window.innerHeight - 280;
    return { top: Math.round(top), bottom: Math.round(bottom) };
  }

  function placeDock(want) {
    var dock = $('mt-dock');
    if (!dock) return;
    var z = zone();
    // якщо звичайна панель не вміщується між рядком активу і блоком угоди — компактний режим
    if (!dock.classList.contains('mt-collapsed')) {
      var wasTight = dock.classList.contains('mt-tight');
      dock.classList.remove('mt-tight');
      var natural = dock.offsetHeight;
      var tight = natural > (z.bottom - z.top - 16);
      dock.classList.toggle('mt-tight', tight);
      document.documentElement.classList.toggle('mt-tight-on', tight);
      if (wasTight !== tight && $('mt-stack')) $('mt-stack').style.left = '';
    }
    var h = dock.offsetHeight || 260;
    var minT = z.top + 8, maxT = z.bottom - h - 8;
    if (maxT < minT) maxT = minT;
    var t = Math.max(minT, Math.min(maxT, want));
    dock.style.top = Math.round(t) + 'px';
  }

  function layout() {
    var stack = $('mt-stack');
    if (!stack) return;
    var z = zone();
    var head = $('mt-stack-head'), clk = document.querySelector('.current-time');
    if (head) {
      var cr = clk && clk.getBoundingClientRect();
      if (cr && cr.width > 0) {
        head.style.left = Math.round(cr.right + 10) + 'px';
        head.style.top = Math.round(cr.top + cr.height / 2 - 13) + 'px';
      } else { head.style.left = '62px'; head.style.top = (z.top - 30) + 'px'; }
    }
    stack.style.top = (z.top + 8) + 'px';
    stack.style.maxHeight = Math.max(120, Math.round((z.bottom - z.top - 16) * 0.55)) + 'px';
    var saved = lsGet('dockTop', null);
    var dock = $('mt-dock');
    placeDock(saved === null ? (z.bottom - ((dock && dock.offsetHeight) || 260) - 10) : saved);
  }

  // переносимо списки моду в наш стек (сам мод працює з тими ж елементами як і раніше)
  function adopt() {
    if (!MOBILE) return;
    setupMobile();
    var stack = $('mt-stack');
    if (!stack) return;
    ['po-share-list', 'po-scanner-list', 'po-alerts'].forEach(function (id) {
      var n = $(id);
      if (n && n.parentNode !== stack) stack.appendChild(n);
      if (n && !n.__mtObs && window.__mtListObs) { n.__mtObs = 1; window.__mtListObs.observe(n, { childList: true }); }
    });
    var mr = $('modal-root');
    if (mr && !mr.__mtObs && window.__mtListObs) { mr.__mtObs = 1; window.__mtListObs.observe(mr, { childList: true, subtree: true }); }
    var pct = curPct();
    stack.querySelectorAll('li span').forEach(function (sp) {
      if (sp.children.length === 0 && /^\d{3,}%$/.test((sp.textContent || '').trim())) sp.textContent = pct || '—';
    });
    var cnt = stack.querySelectorAll('#po-scanner-list > li, #po-share-list > li, #po-alerts > li').length;
    var nEl = $('mt-stack-n');
    if (nEl) nEl.textContent = cnt;
    stack.classList.toggle('mt-empty', cnt === 0);
    var hd = $('mt-stack-head');
    if (hd) hd.classList.toggle('mt-empty', cnt === 0);
    layout();
    var md = $('po-modal');
    if (md && getComputedStyle(md).display !== 'none') { syncSettings(); }
    markClutter();
    syncQuick();
    syncTrades();
    syncPopups();
    // лічильник онлайну — у панель
    var oc = $('po-online-count'), mo = $('mt-online');
    if (oc && mo) {
      var t = (oc.textContent || '').replace(/\s*online/i, '').trim();
      mo.textContent = t ? ('● ' + t) : '—';
    }
  }

  // ================= ПК-ВЕРСІЯ =================
  var PC = !MOBILE;
  if (PC) document.documentElement.classList.add('mt-pc');

  // ---------- статус з'єднання моду з сервером (зелена / червона крапка) ----------
  if (PC) (function () {
    var W = window.WebSocket;
    if (!W || W.__mtWrap) return;
    function MW(u, p) {
      var s = p !== undefined ? new W(u, p) : new W(u);
      try { if (/moontrade/i.test(String(u))) window.__mtWS = s; } catch (e) {}
      return s;
    }
    MW.prototype = W.prototype;
    ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (k) { MW[k] = W[k]; });
    MW.__mtWrap = true;
    window.WebSocket = MW;
  })();
  function wsOnline() { var s = window.__mtWS; return !!(s && s.readyState === 1); }

  // ---------- звук сигналів ----------
  var SND = { on: lsGet('snd', true), vol: lsGet('sndVol', 70), strat: lsGet('sndStrat', true), share: lsGet('sndShare', true) };
  var actx = null;
  function ac() {
    try {
      if (!actx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; actx = new C(); }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { return null; }
    return actx;
  }
  // браузер дозволяє звук лише після першої дії користувача на сторінці
  if (PC) ['pointerdown', 'keydown'].forEach(function (t) {
    document.addEventListener(t, function () { if (SND.on) ac(); }, { capture: true, passive: true });
  });
  function tone(seq, type) {
    var c = ac();
    if (!c) return;
    var t0 = c.currentTime + 0.02, v = Math.max(0.0002, SND.vol / 100 * 0.35);
    seq.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain(), s = t0 + i * 0.13;
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(v, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.24);
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + 0.26);
    });
  }
  function playKind(k) {
    if (!SND.on) return;
    if (k === 'share') { if (SND.share) tone([523, 784], 'triangle'); return; }
    if (!SND.strat) return;
    if (/entry|confirm/i.test(k)) tone([660, 880, 1100]);   // вхід / підтвердження
    else if (/live/i.test(k)) tone([740, 988]);             // дотик живої лінії
    else tone([660]);                                       // можливий дотик / відкат
  }
  function watchSignals() {
    var sc = $('po-scanner-list'), sh = $('po-share-list');
    function scan(silent) {
      var best = null, rank = { soft: 1, live: 2, entry: 3 };
      if (sc) [].slice.call(sc.children).forEach(function (li) {
        var k = li.getAttribute('data-kind') || '';
        if (li.__mtK === k) return;
        li.__mtK = k;
        var r = /entry|confirm/i.test(k) ? 'entry' : (/live/i.test(k) ? 'live' : 'soft');
        if (!best || rank[r] > rank[best]) best = r;
      });
      var shared = false;
      if (sh) [].slice.call(sh.children).forEach(function (li) { if (!li.__mtSeen) { li.__mtSeen = 1; shared = true; } });
      if (silent) return;
      if (best) playKind(best === 'soft' ? 'warning' : best);
      else if (shared) playKind('share');
    }
    [[sc, 'sc'], [sh, 'sh']].forEach(function (p) {
      var n = p[0];
      if (!n || n.__mtSnd) return;
      n.__mtSnd = 1;
      scan(true);
      new MutationObserver(function () { scan(false); })
        .observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-kind'] });
    });
  }

  // ---------- гарячі клавіші: стандартні як у моді + можна задати свої ----------
  var ACTS = [
    { id: 'up', n: 'Попередній актив', mod: 'ArrowUp', def: ['ArrowUp'] },
    { id: 'down', n: 'Наступний актив', mod: 'ArrowDown', def: ['ArrowDown'] },
    { id: 'left', n: 'Попередня група активів', mod: 'ArrowLeft', def: ['ArrowLeft'] },
    { id: 'right', n: 'Наступна група активів', mod: 'ArrowRight', def: ['ArrowRight'] },
    { id: 'tf1', n: 'Таймфрейм M1', mod: '1', def: ['1'] },
    { id: 'tf2', n: 'Таймфрейм M2', mod: '2', def: ['2'] },
    { id: 'tf3', n: 'Таймфрейм M3', mod: '3', def: ['3'] },
    { id: 'tf5', n: 'Таймфрейм M5', mod: '5', def: ['5'] },
    { id: 'tf10', n: 'Таймфрейм M10', mod: '6', def: ['6'] },
    { id: 'tf15', n: 'Таймфрейм M15', mod: '7', def: ['7'] },
    { id: 'alltf', n: 'Усі таймфрейми', def: [] },
    { id: 'hline', n: 'Горизонтальна лінія', mod: 'l', def: ['L'] },
    { id: 'trend', n: 'Лінія тренда', def: [] },
    { id: 'rect', n: 'Прямокутник', mod: 'k', def: ['K'] },
    { id: 'fib', n: 'Лінії Фібоначчі', mod: ';', def: [';'] },
    { id: 'undo', n: 'Видалити останню побудову', mod: 'Backspace', def: ['Backspace', 'Delete'] },
    { id: 'send', n: 'Надіслати сигнал', def: [] },
    { id: 'menu', n: 'Меню моду', def: [] },
    { id: 'sound', n: 'Звук увімк. / вимк.', def: [] }
  ];
  var KEYS = lsGet('keys', {});   // id -> "Alt+S" | null (вимкнено)
  function actById(id) { for (var i = 0; i < ACTS.length; i++) if (ACTS[i].id === id) return ACTS[i]; return null; }
  function sigOf(e) {
    var c = e.code || '', m;
    var main = (m = c.match(/^Key([A-Z])$/)) ? m[1] :
      (m = c.match(/^(?:Digit|Numpad)(\d)$/)) ? m[1] :
      c === 'Semicolon' ? ';' :
      /^(Arrow|F\d|Backspace|Delete|Space|Enter|Tab|Home|End|PageUp|PageDown|Insert)/.test(c) ? c :
      (e.key && e.key.length === 1 ? e.key.toUpperCase() : (c || e.key));
    var mods = (e.ctrlKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + (e.metaKey ? 'Cmd+' : '');
    return mods + main;
  }
  function sigLabel(s) {
    if (!s) return '—';
    return s.replace('ArrowUp', '↑').replace('ArrowDown', '↓').replace('ArrowLeft', '←').replace('ArrowRight', '→')
      .replace('Backspace', '⌫').replace('Delete', 'Del').replace('Space', 'Пробіл');
  }
  function effSigs(a) {
    if (Object.prototype.hasOwnProperty.call(KEYS, a.id)) return KEYS[a.id] ? [KEYS[a.id]] : [];
    return a.def;
  }
  var passing = false, capturing = null;
  function modKey(k) {
    passing = true;
    try { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); } finally { passing = false; }
  }
  function closeDropDown() {
    var w = document.querySelector('.drop-down-modal-wrap');
    if (!w) return;
    w.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    w.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  function pcDraw(type) {
    var open = !!document.querySelector('.drop-down-modal--drawings-list');
    if (!open) { var b = document.querySelector('.items__link--drawings'); if (!b) return; b.click(); }
    var n = 0;
    (function tryIt() {
      var it = document.querySelector('.drop-down-modal--drawings-list .list-item[data-type="' + type + '"]');
      if (it) { it.click(); setTimeout(closeDropDown, 80); return; }
      if (n++ < 20) setTimeout(tryIt, 50);
    })();
  }
  function runAct(id) {
    var a = actById(id);
    if (!a) return;
    if (a.mod) { modKey(a.mod); setTimeout(syncBar, 400); return; }
    if (id === 'alltf') { var o = document.querySelector('.items__link--chart-type:not(.chart-layout-options-btn)'); if (o) o.click(); }
    else if (id === 'trend') pcDraw(5);
    else if (id === 'send' || id === 'menu') { var t = $(id === 'send' ? 'po-send-btn' : 'po-settings-btn'); if (t) setTimeout(function () { t.click(); }, 0); }
    else if (id === 'sound') { SND.on = !SND.on; lsSet('snd', SND.on); if (SND.on) { ac(); tone([660, 880]); } syncBar(); paintSound(); }
  }
  function assignKey(id, s) {
    ACTS.forEach(function (b) {
      if (b.id !== id && effSigs(b).indexOf(s) > -1) KEYS[b.id] = null;   // ця клавіша була зайнята — звільняємо
    });
    var a = actById(id);
    if (a && a.def[0] === s && a.def.length === 1) delete KEYS[id]; else KEYS[id] = s;
    lsSet('keys', KEYS);
  }
  if (PC) window.addEventListener('keydown', function (e) {
    if (passing) return;
    if (capturing) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.key === 'Escape') { capturing = null; paintKeys(); return; }
      if (/^(Shift|Control|Alt|Meta|OS)$/.test(e.key)) return;
      assignKey(capturing, sigOf(e)); capturing = null; paintKeys(); syncBar(true);
      return;
    }
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var s = sigOf(e), i, a;
    for (i = 0; i < ACTS.length; i++) {
      a = ACTS[i];
      if (KEYS[a.id] && KEYS[a.id] === s) { e.preventDefault(); e.stopImmediatePropagation(); runAct(a.id); return; }
    }
    // стандартна клавіша дії, яку перепризначили, більше не спрацьовує
    if (!(e.ctrlKey || e.altKey || e.metaKey)) {
      var plain = s.replace(/^Shift\+/, '');
      for (i = 0; i < ACTS.length; i++) {
        a = ACTS[i];
        if (a.mod && Object.prototype.hasOwnProperty.call(KEYS, a.id) && a.def.indexOf(plain) > -1) { e.stopImmediatePropagation(); return; }
      }
    }
  }, true);

  // ---------- верхня панель MoonTrade (можна перетягнути) ----------
  var BAR = [
    ['grip'], ['up', '▲'], ['down', '▼'], ['sep'],
    ['tf1', 'M1'], ['tf2', 'M2'], ['tf3', 'M3'], ['tf5', 'M5'], ['tf10', 'M10'], ['tf15', 'M15'], ['alltf', 'ТФ ▾'], ['sep'],
    ['hline', '—'], ['trend', '╱'], ['rect', '▭'], ['fib', 'Ф'], ['undo', '⌫'], ['sep'],
    ['send', '📣'], ['sound', '🔊'], ['menu', '☰'], ['sep'], ['status']
  ];
  function setupPC() {
    if (!PC || $('mt-bar')) return;
    var bar = el('div', { id: 'mt-bar' });
    bar.innerHTML = '<div class="mt-grp">' + BAR.map(function (b) {
      if (b[0] === 'grip') return '<div class="mt-grip" title="Перетягніть панель"></div>';
      if (b[0] === 'sep') return '</div><div class="mt-sep"></div><div class="mt-grp">';
      if (b[0] === 'status') return '<div class="mt-st" id="mt-st"><span class="mt-dot" id="mt-dot"></span><span id="mt-online">—</span></div>';
      return '<button type="button" data-a="' + b[0] + '"' + (b[0] === 'send' ? ' class="mt-primary"' : '') + '>' + b[1] + '</button>';
    }).join('') + '</div>';
    document.documentElement.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]');
      if (!b) return;
      e.stopPropagation();
      runAct(b.getAttribute('data-a'));
    });
    // перетягування за ручку
    var grip = bar.querySelector('.mt-grip'), dx = 0, dy = 0, drag = false;
    grip.addEventListener('mousedown', function (e) {
      drag = true; var r = bar.getBoundingClientRect(); dx = e.clientX - r.left; dy = e.clientY - r.top;
      document.documentElement.classList.add('mt-dragging'); e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) { if (drag) placeBar(e.clientX - dx, e.clientY - dy); });
    window.addEventListener('mouseup', function () {
      if (!drag) return;
      drag = false; document.documentElement.classList.remove('mt-dragging');
      var r = bar.getBoundingClientRect(); lsSet('barPos', { x: Math.round(r.left), y: Math.round(r.top) });
    });
    window.addEventListener('resize', function () { placeBarSaved(); });
    syncBar(true);
    placeBarSaved();
  }
  function placeBar(x, y) {
    var bar = $('mt-bar');
    if (!bar) return;
    var w = bar.offsetWidth, h = bar.offsetHeight;
    bar.style.left = Math.round(Math.max(4, Math.min(window.innerWidth - w - 4, x))) + 'px';
    bar.style.top = Math.round(Math.max(4, Math.min(window.innerHeight - h - 4, y))) + 'px';
  }
  // початково — зверху графіка, праворуч від інструментів PO (або під ними, якщо не вміщується)
  function barDefault() {
    var bar = $('mt-bar'), tb = document.querySelector('.top-left-block__block1');
    var chart = document.querySelector('canvas.layer.plot') || document.querySelector('.layout-container');
    if (!bar || !tb || !chart) return { x: 100, y: 70 };
    var c = chart.getBoundingClientRect(), r = tb.getBoundingClientRect(), right = c.right - 70;
    bar.style.maxWidth = 'none';
    var w = bar.offsetWidth, h = bar.offsetHeight;
    if (r.right + 12 + w <= right) return { x: r.right + 12, y: r.top + (r.height - h) / 2 };
    // під інструментами PO; якщо графік вузький — панель переноситься у два рядки
    bar.style.maxWidth = Math.max(220, right - r.left) + 'px';
    return { x: r.left, y: r.bottom + 46 };
  }
  function placeBarSaved() {
    var p = lsGet('barPos', null);
    if (p) { var bar = $('mt-bar'); if (bar) bar.style.maxWidth = 'none'; placeBar(p.x, p.y); return; }
    p = barDefault();
    placeBar(p.x, p.y);
  }
  function syncBar(titles) {
    var bar = $('mt-bar');
    if (!bar) return;
    if (titles) [].slice.call(bar.querySelectorAll('button[data-a]')).forEach(function (b) {
      var a = actById(b.getAttribute('data-a')), k = a ? effSigs(a)[0] : null;
      b.title = (a ? a.n : '') + (k ? '  [' + sigLabel(k) + ']' : '');
    });
    var tfEl = document.querySelector('.items__link--chart-type:not(.chart-layout-options-btn)');
    var tf = tfEl ? (((tfEl.textContent || '').trim().match(/^[SMHD]\d+/) || [''])[0]) : '';
    [].slice.call(bar.querySelectorAll('button[data-a^="tf"]')).forEach(function (b) { b.classList.toggle('mt-on', b.textContent === tf); });
    var sb = bar.querySelector('[data-a="sound"]');
    if (sb) { sb.textContent = SND.on ? '🔊' : '🔇'; sb.classList.toggle('mt-off', !SND.on); }
    var on = wsOnline(), dot = $('mt-dot');
    if (dot) { dot.classList.toggle('on', on); dot.title = on ? 'Мод підключений до сервера' : 'Немає з’єднання з сервером моду'; }
    var oc = $('po-online-count'), mo = $('mt-online');
    if (mo) { var t = oc ? (oc.textContent || '').replace(/\s*online/i, '').trim() : ''; mo.textContent = t || '—'; var st = $('mt-st'); if (st) st.title = (on ? 'Мод підключений' : 'Немає з’єднання з сервером моду') + (t ? ' · онлайн: ' + t : ''); }
  }

  // ---------- чистий інтерфейс на ПК ----------
  function markClutterPC() {
    var R = document.querySelector('.right-sidebar');
    if (!R) return;
    var ul = R.querySelector('nav > ul:not(.bottom)');
    if (!ul) return;
    var lis = [].slice.call(ul.children).filter(function (li) { return !li.hasAttribute('data-mt-add'); });
    var keep = [];
    lis.forEach(function (li, i) {
      var p = li.querySelector('svg path'), d = (p && p.getAttribute('d')) || '';
      var t = ((li.querySelector('.nlabel') || li).textContent || '').trim();
      if (d.indexOf('M14.3839 5.46875') === 0 || /^(Угоди|Trades|Сделки)$/i.test(t)) keep.push(li);                     // «Угоди»
      else if (/^(Відкладен|Pending|Отложен)/i.test(t)) keep.push(li);                                                      // «Відкладена угода»
      else if (lis[i + 1] && lis[i + 1].querySelector('.hotkeys-icon') && !/Експрес|Express|Экспресс/i.test(t)) keep.push(li); // запасний варіант: перед «Гарячі клавіші»
    });
    if (!keep.length) return;   // структура PO змінилась — нічого не ховаємо
    lis.forEach(function (li) { if (keep.indexOf(li) > -1) li.removeAttribute('data-mt-x'); else li.setAttribute('data-mt-x', '1'); });
    [].slice.call(R.children).forEach(function (c) { if (c.tagName !== 'NAV') c.setAttribute('data-mt-x', '1'); });   // перемикач «Classic mode»
    // «Чат» і «Допомога» з лівої панелі — у праву
    var L = document.querySelector('.left-sidebar');
    if (!L) return;
    var chat = [].slice.call(L.querySelectorAll('li > a')).filter(function (a) { return !a.hasAttribute('data-menu-id') && a.querySelector('svg'); })[0];
    var help = L.querySelector('a[data-menu-id="support"]');
    [['chat', chat], ['help', help]].forEach(function (p) {
      var src = p[1];
      if (!src) return;
      var li = ul.querySelector('[data-mt-add="' + p[0] + '"]');
      if (!li) {
        li = el('li', { 'data-mt-add': p[0] });
        var a = el('a', { 'class': 'tooltip2' });
        li.appendChild(a);
        a.addEventListener('click', function (e) { e.preventDefault(); src.click(); });
        ul.appendChild(li);
      }
      var lb = src.querySelector('.nlabel'), cn = [].slice.call(src.querySelectorAll('.counter__number')).filter(function (x) { return x.offsetParent || getComputedStyle(x.closest('.counter') || x).display !== 'none'; })[0];
      var lbl = ((lb ? lb.textContent : (src.innerText || '').split('\n')[0]) || '').trim();
      var badge = cn ? (cn.textContent || '').trim() : '';
      var key = lbl + '|' + badge;
      if (li.getAttribute('data-k') !== key) {
        var svg = src.querySelector('svg');
        li.firstChild.innerHTML = (svg ? svg.outerHTML : '') + '<span class="nlabel">' + lbl + '</span>' + (/^\d+$/.test(badge) ? '<i class="mt-badge">' + badge + '</i>' : '');
        li.setAttribute('data-k', key);
      }
    });
  }

  // ---------- меню моду на ПК: вкладки ----------
  var TABS = [['sig', 'Сигнали'], ['pay', 'Виплати'], ['ui', 'Інтерфейс'], ['snd', 'Звук'], ['keys', 'Клавіші']];
  function secOf(n) {
    if (n.querySelector && (n.id === 'po-toggle-header' || n.id === 'po-toggle-hud')) return 'ui';
    if (/^po-toggle-(share|scanner|stcci)$/.test(n.id) || (n.querySelector && n.querySelector('#po-nickname-input'))) return 'sig';
    if (n.id === 'po-range-wrap') return 'pay';
    return null;
  }
  function syncTabs() {
    var md = $('po-modal');
    if (!PC || !md) return;
    var body = null;
    [].slice.call(md.children).forEach(function (c) { if (c.querySelector && c.querySelector('#po-toggle-share')) body = c; });
    if (!body) return;
    var pend = [];
    [].slice.call(body.children).forEach(function (c) {
      var s = secOf(c);
      if (!s) { pend.push(c); return; }
      c.setAttribute('data-mt-tab', s);
      pend.forEach(function (p) { p.setAttribute('data-mt-tab', s); });
      pend = [];
    });
    pend.forEach(function (p) { p.setAttribute('data-mt-tab', 'pay'); });
    var bar = $('mt-tabs');
    if (!bar) {
      bar = el('div', { id: 'mt-tabs' });
      bar.innerHTML = TABS.map(function (t) { return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-t]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        lsSet('tab', b.getAttribute('data-t')); paintTabs();
      });
      md.insertBefore(bar, md.firstElementChild ? md.firstElementChild.nextSibling : null);
    }
    var set = $('mt-set');
    if (set) {
      set.setAttribute('data-mt-tab', 'ui');
      if (set.previousSibling !== bar) md.insertBefore(set, bar.nextSibling);
      if (!set.querySelector('[data-o="barpos"]')) {
        var r = el('div', { 'class': 'mt-btnrow', 'data-o': 'barpos' },
          '<span>Панель MoonTrade<small>Перетягується за ліву ручку</small></span><button type="button">Повернути нагору</button>');
        r.querySelector('button').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); lsSet('barPos', null); placeBarSaved(); });
        set.appendChild(r);
      }
    }
    syncSoundPane(md, body);
    syncKeysPane(md, body);
    paintTabs();
  }
  function paintTabs() {
    var md = $('po-modal'), cur = lsGet('tab', 'sig');
    if (md) md.setAttribute('data-mt-cur', cur);
    var bar = $('mt-tabs');
    if (bar) [].slice.call(bar.children).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === cur); });
  }
  function syncSoundPane(md, body) {
    var p = $('mt-snd');
    if (!p) {
      p = el('div', { id: 'mt-snd', 'class': 'mt-pane', 'data-mt-tab': 'snd' });
      p.innerHTML =
        '<div class="mt-h">Звук сигналів</div>' +
        '<label data-s="on"><span>Звук сигналів<small>Чути, навіть коли вкладка неактивна</small></span><span class="mt-sw"></span></label>' +
        '<label data-s="strat"><span>Стратегії BB і ST+CCI<small>Можливий дотик — 1 тон, дотик лінії — 2, вхід — 3</small></span><span class="mt-sw"></span></label>' +
        '<label data-s="share"><span>Сигнали від трейдерів</span><span class="mt-sw"></span></label>' +
        '<div class="mt-vol"><span>Гучність</span><input type="range" min="5" max="100" step="5"><b></b></div>' +
        '<div class="mt-btnrow"><span>Перевірка</span><button type="button" data-s="test">▶ Програти звук входу</button></div>';
      p.addEventListener('click', function (e) {
        var lb = e.target.closest('label[data-s]'), tb = e.target.closest('[data-s="test"]');
        if (lb) { e.preventDefault(); e.stopPropagation(); var k = lb.getAttribute('data-s'); SND[k] = !SND[k]; lsSet(k === 'on' ? 'snd' : 'snd' + k.charAt(0).toUpperCase() + k.slice(1), SND[k]); paintSound(); syncBar(); }
        if (tb) { e.preventDefault(); e.stopPropagation(); ac(); var was = SND.on; SND.on = true; playKind('entry'); SND.on = was; }
      });
      var rg = p.querySelector('input[type=range]');
      rg.addEventListener('input', function () { SND.vol = +rg.value; lsSet('sndVol', SND.vol); paintSound(); });
      rg.addEventListener('change', function () { ac(); var was = SND.on; SND.on = true; playKind('warning'); SND.on = was; });
      md.insertBefore(p, body.nextSibling);
    }
    paintSound();
  }
  function paintSound() {
    var p = $('mt-snd');
    if (!p) return;
    [].slice.call(p.querySelectorAll('label[data-s]')).forEach(function (lb) { lb.querySelector('.mt-sw').classList.toggle('on', !!SND[lb.getAttribute('data-s')]); });
    var rg = p.querySelector('input[type=range]');
    if (document.activeElement !== rg) rg.value = SND.vol;
    p.querySelector('.mt-vol b').textContent = SND.vol + '%';
  }
  function syncKeysPane(md, body) {
    var p = $('mt-keys');
    if (!p) {
      p = el('div', { id: 'mt-keys', 'class': 'mt-pane', 'data-mt-tab': 'keys' });
      p.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        var id = b.getAttribute('data-id');
        if (b.classList.contains('mt-kb')) { capturing = capturing === id ? null : id; }
        else if (b.classList.contains('mt-kr')) { delete KEYS[id]; lsSet('keys', KEYS); }
        else if (b.getAttribute('data-k') === 'all') { KEYS = {}; lsSet('keys', KEYS); capturing = null; }
        paintKeys(); syncBar(true);
      });
      md.insertBefore(p, ($('mt-snd') || body).nextSibling);
    }
    paintKeys();
  }
  function paintKeys() {
    var p = $('mt-keys');
    if (!p) return;
    var html = '<div class="mt-h">Гарячі клавіші</div><div class="mt-note">Натисніть на клавішу праворуч і задайте свою комбінацію (можна з Ctrl, Alt, Shift). Esc — скасувати.</div>' +
      ACTS.map(function (a) {
        var s = effSigs(a), changed = Object.prototype.hasOwnProperty.call(KEYS, a.id);
        var lbl = capturing === a.id ? 'Натисніть…' : (s.length ? s.map(sigLabel).join(' / ') : '—');
        return '<div class="mt-k' + (changed ? ' mt-ch' : '') + '"><span>' + a.n + '</span>' +
          '<button type="button" class="mt-kb' + (capturing === a.id ? ' mt-wait' : '') + '" data-id="' + a.id + '">' + lbl + '</button>' +
          '<button type="button" class="mt-kr" data-id="' + a.id + '" title="Повернути стандартну"' + (changed ? '' : ' disabled') + '>↺</button></div>';
      }).join('') +
      '<div class="mt-btnrow"><span>Усі клавіші</span><button type="button" data-k="all">Скинути до стандартних</button></div>';
    if (p.getAttribute('data-h') !== html) { p.innerHTML = html; p.setAttribute('data-h', html); }
  }

  // ---------- підсумок «Сьогодні» в «Угодах» на ПК ----------
  function syncTradesPC() {
    var slot = document.querySelector('.widget-slot.deals');
    var sum = $('mt-sum');
    var list = slot && slot.querySelector('.deals-list');
    var act = slot && slot.querySelector('.widget-slot__header .divider li.active');
    if (!list || !act || !OPT.theme || !/Закрит|Closed|Закрыт/i.test(act.textContent)) { if (sum) sum.remove(); return; }
    var html = todayHtml(list);
    if (!sum) sum = el('div', { id: 'mt-sum' });
    var body = list.closest('.widget-slot__body') || list;
    if (sum.nextSibling !== body) body.parentNode.insertBefore(sum, body);
    if (sum.getAttribute('data-h') !== html) { sum.innerHTML = html; sum.setAttribute('data-h', html); }
  }

  function adoptPC() {
    if (!PC) return;
    setupPC();
    markClutter();
    markClutterPC();
    syncQuick();
    syncTradesPC();
    watchSignals();
    syncBar();
    if (!lsGet('barPos', null)) placeBarSaved();   // графік міг звузитись (відкрили чат тощо)
    var md = $('po-modal');
    if (md && getComputedStyle(md).display !== 'none') { syncSettings(); syncTabs(); }
  }

  // ---------- запуск моду ----------
  fetch('https://api.moontrade.it.com/script/main.js', { cache: 'no-store' })
    .then(function (r) { return r.text(); })
    .then(function (js) { new Function(js)(); })
    .catch(function (e) { console.error('[PO] fetch failed', e); });

  var pend = false;
  function adoptAny() { if (MOBILE) adopt(); else adoptPC(); }
  var mo = new MutationObserver(function () {
    if (pend) return;
    pend = true;
    requestAnimationFrame(function () { pend = false; adoptAny(); });
  });
  mo.observe(document.documentElement, { childList: true });
  if (document.body) mo.observe(document.body, { childList: true });
  if (MOBILE) window.__mtListObs = mo;
  setInterval(adoptAny, 2000);
  // швидка реакція на відкриття / закриття «Угод», меню моду та інших вікон PO
  document.addEventListener('click', function () { setTimeout(adoptAny, 120); setTimeout(adoptAny, 450); }, true);
  ['input', 'change', 'keyup'].forEach(function (t) {
    document.addEventListener(t, function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('multiply-field')) setTimeout(function () { readPoK(); paintQuick(); }, 0);
    }, true);
  });
  adoptAny();
})();
