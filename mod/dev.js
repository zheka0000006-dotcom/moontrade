// ==UserScript==
// @name         MoonTrade Mod
// @version      3.1
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
    'html.mt-m:not(.mt-clean) [data-mt-add]{display:none!important;}',
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
    /* іконки PO (FontAwesome) не мають втрачати свій шрифт через стиль MoonTrade */
    'html.mt-ptheme .fa,html.mt-theme .fa{font-family:FontAwesome!important;}',
    /* кнопки моду «Надіслати / МОД» і бейдж онлайну — тепер у панелі MoonTrade */
    '.mt-pc #po-online-badge{display:none!important;}',
    '.mt-pc #po-top-btns{visibility:hidden!important;pointer-events:none!important;}',
    '.mt-pc #mt-kchip{height:24px;padding:0 7px;margin-right:2px;font-size:11px;line-height:24px;}',
    '#mt-bar{position:fixed;left:-9999px;top:70px;z-index:11;display:flex;align-items:center;gap:6px;padding:5px 8px 5px 6px;border-radius:16px;',
    'background:rgba(22,15,43,.94);border:1px solid var(--mt-line);box-shadow:0 10px 30px rgba(0,0,0,.45);',
    '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);font-family:var(--mt-font);-webkit-user-select:none;user-select:none;}',
    'html.mt-nobar #mt-bar{display:none!important;}',
    '#mt-bar .mt-grip{width:10px;height:30px;cursor:grab;border-radius:4px;opacity:.75;',
    'background:radial-gradient(circle,var(--mt-muted) 1.2px,transparent 1.6px) 0 0/5px 5px;}',
    '#mt-bar button{all:unset;box-sizing:border-box;height:38px;min-width:38px;padding:0 10px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;',
    'color:var(--mt-ink);font:700 16px/1 var(--mt-font);background:rgba(139,92,246,.10);border:1px solid rgba(139,92,246,.2);cursor:pointer;white-space:nowrap;transition:background .15s,transform .1s;}',
    '#mt-bar button:hover{background:rgba(139,92,246,.26);}',
    '#mt-bar button:active{transform:scale(.95);}',
    '#mt-bar button.mt-send{background:var(--mt-grad);border-color:transparent;color:#fff;font-size:14px;padding:0 16px;box-shadow:0 6px 16px rgba(109,61,240,.35);}',
    '#mt-bar button.mt-send:hover{filter:brightness(1.12);}',
    '#mt-bar button.mt-off{opacity:.5;}',
    '#mt-bar .mt-st{display:flex;align-items:center;gap:7px;height:38px;padding:0 12px;border-radius:12px;background:rgba(63,224,160,.08);',
    'border:1px solid rgba(63,224,160,.22);font:700 13px/1 var(--mt-font);color:var(--mt-ink);white-space:nowrap;}',
    '#mt-bar .mt-dot{width:9px;height:9px;border-radius:50%;background:var(--mt-rose);box-shadow:0 0 8px var(--mt-rose);}',
    '#mt-bar .mt-dot.on{background:var(--mt-mint);box-shadow:0 0 8px var(--mt-mint);}',
    '#mt-bar .mt-dot:not(.on) + span{color:var(--mt-rose);}',
    'html.mt-dragging,html.mt-dragging *{cursor:grabbing!important;}',
    'html.mt-nocards #po-scanner-list,html.mt-nocards #po-share-list,html.mt-nocards #po-alerts{display:none!important;}',

    /* меню моду: вкладки */
    '.mt-pc #po-modal{max-height:calc(100vh - 80px)!important;overflow-y:auto!important;max-width:440px!important;}',
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
    '.mt-pane .mt-h2{margin-top:10px;padding-top:14px;border-top:1px solid var(--mt-line);}',
    '.mt-pane label{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:34px;cursor:pointer;font:600 14px/1.25 var(--mt-font);}',
    '.mt-pane label small,.mt-btnrow small{display:block;color:var(--mt-muted);font:500 11px/1.3 var(--mt-font);margin-top:2px;}',
    '.mt-pane .mt-sw{flex-shrink:0;width:40px;height:22px;border-radius:11px;background:#2c2554;position:relative;transition:.2s;}',
    '.mt-pane .mt-sw::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s;}',
    '.mt-pane .mt-sw.on{background:var(--mt-grad);}',
    '.mt-pane .mt-sw.on::after{left:21px;}',
    '.mt-snd-row{display:flex;align-items:center;gap:10px;}',
    '.mt-snd-row label{flex:1;}',
    '.mt-snd-row button{all:unset;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
    'font-size:11px;color:var(--mt-moon);background:rgba(139,92,246,.12);border:1px solid var(--mt-line);}',
    '.mt-snd-row button:hover{background:rgba(139,92,246,.28);}',
    '#mt-snd.mt-muted .mt-snd-row,#mt-snd.mt-muted .mt-vol{opacity:.45;}',
    '.mt-vol{display:flex;align-items:center;gap:12px;font:600 14px/1 var(--mt-font);}',
    '.mt-vol input{flex:1;accent-color:#8b5cf6;}',
    '.mt-vol b{min-width:40px;text-align:right;color:var(--mt-moon);font-size:13px;}',
    '.mt-btnrow{display:flex;align-items:center;justify-content:space-between;gap:12px;font:600 14px/1.25 var(--mt-font);color:var(--mt-ink);min-height:34px;}',
    '.mt-btnrow button{all:unset;cursor:pointer;padding:7px 12px;border-radius:999px;font:700 12px/1 var(--mt-font);color:var(--mt-moon);',
    'background:rgba(139,92,246,.10);border:1px solid var(--mt-line);white-space:nowrap;}',
    '.mt-btnrow button:hover{background:rgba(139,92,246,.24);}',
    '.mt-btnrow button.mt-add{background:var(--mt-grad);color:#fff;border-color:transparent;}',
    '.mt-note{color:var(--mt-muted);font:500 12px/1.4 var(--mt-font);}',
    '.mt-k{display:flex;align-items:center;gap:8px;font:600 13px/1.2 var(--mt-font);min-height:30px;}',
    '.mt-k > span{flex:1;}',
    '.mt-k.mt-ch > span{color:var(--mt-moon);}',
    '.mt-k select{flex:1;min-width:0;height:30px;padding:0 8px;border-radius:8px;background:var(--mt-night);color:var(--mt-ink);',
    'border:1px solid var(--mt-line);font:600 12px/1 var(--mt-font);cursor:pointer;outline:none;}',
    '.mt-k select:focus{border-color:var(--mt-violet);}',
    '.mt-k select option,.mt-k select optgroup{background:#160f2b;color:var(--mt-ink);}',
    '.mt-kb{all:unset;cursor:pointer;min-width:74px;text-align:center;padding:6px 10px;border-radius:8px;font:700 12px/1 var(--mt-font);',
    'color:var(--mt-ink);background:var(--mt-night);border:1px solid var(--mt-line);box-shadow:inset 0 -2px 0 rgba(139,92,246,.25);}',
    '.mt-kb:hover{border-color:var(--mt-violet);}',
    '.mt-kb.mt-empty{color:var(--mt-muted);border-style:dashed;}',
    '.mt-kb.mt-wait{background:var(--mt-grad);color:#fff;border-color:transparent;}',
    '.mt-kr{all:unset;cursor:pointer;width:24px;text-align:center;color:var(--mt-muted);font-size:14px;}',
    '.mt-kr:hover{color:var(--mt-ink);}',
    '.mt-kr[disabled]{opacity:.25;cursor:default;}',

    /* чистий інтерфейс на ПК */
    '.mt-pclean .left-sidebar{display:none!important;}',
    '.mt-pclean .right-sidebar [data-mt-x],html.mt-pclean > [data-mt-x]{display:none!important;}',
    '.mt-pclean .call-put-block .block__title .tooltip2{display:none!important;}',
    'html:not(.mt-pclean) .right-sidebar [data-mt-add]{display:none!important;}',
    '.right-sidebar [data-mt-add] a{position:relative;cursor:pointer;}',
    '.right-sidebar .mt-badge{position:absolute;top:6px;right:18px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:8px;',
    'background:var(--mt-violet);color:#fff;font:700 10px/16px var(--mt-font);font-style:normal;text-align:center;}',
    /* список активів PO не виходить за межі свого вікна */
    '.mt-pc .assets-block__col-body{display:flex!important;flex-direction:column!important;}',
    '.mt-pc .assets-block__body-wrap{flex:1 1 0!important;min-height:0!important;}',
    '.mt-pc .assets-block__body{height:100%!important;}',
    '.mt-pc .assets-block__body > .scrollbar-container{max-height:100%!important;}',

    /* стиль MoonTrade на ПК */
    '.mt-ptheme body,.mt-ptheme .wrapper{background:var(--mt-night)!important;}',
    '.mt-ptheme .site-header{background:#120c27!important;border-bottom:1px solid var(--mt-line)!important;box-shadow:none!important;}',
    '.mt-ptheme .site-header *:not(.fa){font-family:var(--mt-font)!important;}',
    '.mt-ptheme .left-sidebar,.mt-ptheme .right-sidebar{background:#120c27!important;border-color:var(--mt-line)!important;}',
    '.mt-ptheme .right-sidebar .nlabel,.mt-ptheme .left-sidebar a{font-family:var(--mt-font)!important;font-weight:600!important;}',
    '.mt-ptheme .right-sidebar li.active > a,.mt-ptheme .right-sidebar li > a:hover{color:var(--mt-moon)!important;}',
    '.mt-ptheme .call-put-block{background:linear-gradient(180deg,#1a1440,#120c27)!important;border-left:1px solid var(--mt-line)!important;}',
    '.mt-ptheme .call-put-block *:not(.fa){font-family:var(--mt-font)!important;}',
    '.mt-ptheme .call-put-block .block__title{color:var(--mt-muted)!important;font-weight:600!important;}',
    '.mt-ptheme .call-put-block .block__control{background:var(--mt-night)!important;border:1px solid var(--mt-line)!important;border-radius:12px!important;}',
    '.mt-ptheme .call-put-block .value__val{color:var(--mt-ink)!important;font-weight:700!important;}',
    '.mt-ptheme .block--payout .block__control{background:rgba(139,92,246,.08)!important;}',
    '.mt-ptheme .block--payout .value__val-start{color:var(--mt-mint)!important;font-weight:800!important;}',
    '.mt-ptheme .btn-call,.mt-ptheme .btn-put{border-radius:14px!important;font-weight:800!important;letter-spacing:.4px;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 18px rgba(0,0,0,.3)!important;}',
    '.mt-ptheme .top-left-block .items__link,.mt-ptheme .top-left-block .currencies-block__in{background:rgba(22,15,43,.92)!important;border:1px solid var(--mt-line)!important;border-radius:10px!important;}',
    '.mt-ptheme .drop-down-modal{background:#160f2b!important;border:1px solid var(--mt-line)!important;border-radius:14px!important;}',
    '.mt-ptheme .drop-down-modal *:not(.fa){font-family:var(--mt-font)!important;}',
    '.mt-ptheme .drop-down-modal .fa-star-o,.mt-ptheme .drop-down-modal .fa-star{color:var(--mt-muted)!important;}',
    '.mt-ptheme .drop-down-modal .alist__item--active{background:rgba(139,92,246,.18)!important;}',
    '.mt-ptheme .h-btn--deposit{border-radius:12px!important;}',
    /* «Угоди» на ПК */
    '.mt-ptheme .widget-slot.deals,.mt-ptheme .widget-slot.deals .widget-slot__body{background:#120c27!important;border-color:var(--mt-line)!important;}',
    '.mt-ptheme .widget-slot.deals *:not(.fa){font-family:var(--mt-font)!important;}',
    '.mt-ptheme .widget-slot.deals .widget-slot__header{background:#120c27!important;border:0!important;padding-bottom:2px!important;}',
    '.mt-ptheme .widget-slot.deals .widget-slot__header .title{background:transparent!important;font-weight:800!important;font-size:15px!important;color:var(--mt-ink)!important;}',
    '.mt-ptheme .widget-slot.deals #mt-sum{margin:2px 10px 10px!important;}',
    '.mt-ptheme .widget-slot.deals .divider{margin:0 10px 8px!important;height:auto!important;border:0!important;}',
    '.mt-ptheme .widget-slot.deals .divider ul{display:flex!important;gap:4px!important;padding:4px!important;margin:0!important;border-radius:12px!important;',
    'background:var(--mt-night)!important;border:1px solid var(--mt-line)!important;}',
    '.mt-ptheme .widget-slot.deals .divider li{flex:1 1 0!important;margin:0!important;border:0!important;background:transparent!important;}',
    '.mt-ptheme .widget-slot.deals .divider li::before,.mt-ptheme .widget-slot.deals .divider li::after,.mt-ptheme .widget-slot.deals .divider li a::after,.mt-ptheme .widget-slot.deals .divider li a::before{display:none!important;}',
    '.mt-ptheme .widget-slot.deals .divider li a{height:30px!important;border-radius:9px!important;background:transparent!important;color:var(--mt-muted)!important;',
    'font-weight:700!important;font-size:13px!important;border:0!important;box-shadow:none!important;}',
    '.mt-ptheme .widget-slot.deals .divider li a:hover{color:var(--mt-ink)!important;}',
    '.mt-ptheme .widget-slot.deals .divider li.active a{background:var(--mt-grad)!important;color:#fff!important;}',
    '.mt-ptheme .widget-slot.deals .deals-list__group-label{background:transparent!important;color:var(--mt-muted)!important;font-weight:700!important;',
    'font-size:10px!important;letter-spacing:.8px!important;text-transform:uppercase;padding:10px 14px 6px!important;height:auto!important;justify-content:flex-start!important;}',
    '.mt-ptheme .widget-slot.deals .deals-list__item{background:rgba(22,15,43,.92)!important;border:1px solid var(--mt-line)!important;border-radius:12px!important;',
    'margin:0 10px 6px!important;padding:8px 12px!important;transition:border-color .15s,background .15s;}',
    '.mt-ptheme .widget-slot.deals .deals-list__item:hover{border-color:rgba(139,92,246,.55)!important;background:rgba(139,92,246,.10)!important;}',
    '.mt-ptheme .widget-slot.deals .item-row{color:var(--mt-muted)!important;font-size:12px!important;}',
    '.mt-ptheme .widget-slot.deals .item-row a{color:var(--mt-ink)!important;font-weight:700!important;}',
    '.mt-ptheme .widget-slot.deals .item-row + .item-row{margin-top:4px!important;color:var(--mt-ink)!important;font-weight:700!important;}',
    '.mt-ptheme .widget-slot.deals .price-up{color:var(--mt-mint)!important;}',
    '.mt-ptheme .widget-slot.deals .price-down{color:var(--mt-rose)!important;}',
    '.mt-ptheme .widget-slot.deals .fa-arrow-up{color:var(--mt-mint)!important;margin-right:4px;}',
    '.mt-ptheme .widget-slot.deals .fa-arrow-down{color:var(--mt-rose)!important;margin-right:4px;}',
    '.mt-ptheme .widget-slot.deals .favorites .fa{color:var(--mt-muted)!important;margin-right:4px;}',
    /* меню профілю — як на телефоні */
    '.mt-ptheme .profile-menu__panel{background:var(--mt-night)!important;border-left:1px solid var(--mt-line)!important;}',
    '.mt-ptheme .profile-menu__panel *:not(.fa){font-family:var(--mt-font)!important;}',
    '.mt-ptheme .profile-menu__status-bg{background:radial-gradient(320px 380px at 0 0,rgba(139,92,246,.35),transparent 70%)!important;}',
    '.mt-ptheme .profile-menu__menu{background:#130d28!important;border-top:1px solid var(--mt-line)!important;}',
    '.mt-ptheme .profile-menu__card,.mt-ptheme .profile-menu__chip,.mt-ptheme .profile-menu__lang{background:rgba(22,15,43,.95)!important;border:1px solid var(--mt-line)!important;border-radius:16px!important;}',
    '.mt-ptheme .profile-menu__row-inner{border-color:var(--mt-line)!important;}',
    '.mt-ptheme .profile-menu__head-btn,.mt-ptheme .profile-menu__withdrawal-btn{background:rgba(139,92,246,.14)!important;border-radius:12px!important;}',
    '.mt-ptheme .profile-menu__deposit-btn{border-radius:12px!important;}',
    '.mt-ptheme .profile-menu__row:hover{background:rgba(139,92,246,.08)!important;}'
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

  // ---------- звук сигналів: окремо для BB, ST+CCI і сигналів трейдерів ----------
  var SND = {
    on: lsGet('snd', true), vol: lsGet('sndVol', 70),
    bb: lsGet('sndBb', lsGet('sndStrat', true)), st: lsGet('sndSt', lsGet('sndStrat', true)), share: lsGet('sndShare', true)
  };
  var SND_KEY = { on: 'snd', bb: 'sndBb', st: 'sndSt', share: 'sndShare' };
  function setSnd(k, v) { SND[k] = v; lsSet(SND_KEY[k], v); paintSound(); syncBar(); }
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
  function tone(seq, type, gap) {
    var c = ac();
    if (!c) return;
    var t0 = c.currentTime + 0.02, v = Math.max(0.0002, SND.vol / 100 * 0.35);
    seq.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain(), s = t0 + i * (gap || 0.13);
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(v, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.24);
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + 0.26);
    });
  }
  // BB — «дзвіночок» (sine), ST+CCI — м'якший тембр (triangle) і інша мелодія, трейдери — «дінь-дон»
  var SOUNDS = {
    bb: { soft: [[660], 'sine'], live: [[740, 988], 'sine'], entry: [[660, 880, 1100], 'sine'] },
    st: { soft: [[523, 587], 'triangle'], entry: [[523, 659, 784, 1047], 'triangle'] },
    share: [[988, 784], 'sine']
  };
  function playSignal(strat, level, force) {
    if (!force && !SND.on) return;
    if (strat === 'share') { if (force || SND.share) tone(SOUNDS.share[0], SOUNDS.share[1], 0.18); return; }
    if (!force && !SND[strat]) return;
    var set = SOUNDS[strat] || SOUNDS.bb, s = set[level] || set.entry || set.soft;
    tone(s[0], s[1]);
  }
  function watchSignals() {
    var sc = $('po-scanner-list'), sh = $('po-share-list');
    function scan(silent) {
      var best = null, rank = { soft: 1, live: 2, entry: 3 };
      if (sc) [].slice.call(sc.children).forEach(function (li) {
        var k = li.getAttribute('data-kind') || '';
        if (li.__mtK === k) return;
        li.__mtK = k;
        var strat = /^st/i.test(k) || /^st\|/i.test(li.getAttribute('data-key') || '') ? 'st' : 'bb';
        var lvl = /entry|confirm/i.test(k) ? 'entry' : (/live/i.test(k) ? 'live' : 'soft');
        if (!SND[strat]) return;
        if (!best || rank[lvl] > rank[best.lvl]) best = { strat: strat, lvl: lvl };
      });
      var shared = false;
      if (sh) [].slice.call(sh.children).forEach(function (li) { if (!li.__mtSeen) { li.__mtSeen = 1; shared = true; } });
      if (silent) return;
      if (best) playSignal(best.strat, best.lvl);
      else if (shared) playSignal('share');
    }
    [sc, sh].forEach(function (n) {
      if (!n || n.__mtSnd) return;
      n.__mtSnd = 1;
      scan(true);
      new MutationObserver(function () { scan(false); })
        .observe(n, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-kind'] });
    });
  }

  // ---------- дії PO, які можна викликати кнопкою або клавішею ----------
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
  function waitFor(fn, cb) {
    var n = 0;
    (function go() { var r = fn(); if (r) { cb(r); return; } if (n++ < 20) setTimeout(go, 50); else closeDropDown(); })();
  }
  function pcDraw(type) {
    if (!document.querySelector('.drop-down-modal--drawings-list')) { var b = document.querySelector('.items__link--drawings'); if (!b) return; b.click(); }
    waitFor(function () { return document.querySelector('.drop-down-modal--drawings-list .list-item[data-type="' + type + '"]'); },
      function (it) { it.click(); setTimeout(closeDropDown, 80); });
  }
  function tfOpener() { return document.querySelector('.items__link--chart-type:not(.chart-layout-options-btn)'); }
  function pcTF(t) {
    if (!document.querySelector('.drop-down-modal--chart-type')) { var o = tfOpener(); if (!o) return; o.click(); }
    waitFor(function () {
      return [].slice.call(document.querySelectorAll('.time-frames-block a')).filter(function (a) {
        var sp = a.querySelector('span'); return sp && sp.textContent.trim() === t;
      })[0];
    }, function (l) { l.click(); setTimeout(closeDropDown, 80); });
  }
  function amountOp(i) {   // 0 — помножити на k, 1 — поділити на k (кнопки калькулятора PO)
    if (document.querySelector('.amount-list-modal')) amtToggle();
    wait(150).then(function () { amtToggle(); return wait(400); }).then(function () {
      readPoK();
      var btn = document.querySelectorAll('.amount-list-modal .multiply__btn')[i];
      if (btn) btn.click();
      return wait(250);
    }).then(function () { if (document.querySelector('.amount-list-modal')) amtToggle(); paintQuick(); });
  }
  function toggleHtml(cls, key) { var on = !document.documentElement.classList.contains(cls); document.documentElement.classList.toggle(cls, on); lsSet(key, on); }
  if (PC) {
    if (lsGet('noCards', false)) document.documentElement.classList.add('mt-nocards');
    if (lsGet('noBar', false)) document.documentElement.classList.add('mt-nobar');
  }

  // ---------- стандартні клавіші (як у моді) — можна перепризначити ----------
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
    { id: 'hline', n: 'Горизонтальна лінія', mod: 'l', def: ['L'] },
    { id: 'rect', n: 'Прямокутник', mod: 'k', def: ['K'] },
    { id: 'fib', n: 'Лінії Фібоначчі', mod: ';', def: [';'] },
    { id: 'undo', n: 'Видалити останню побудову', mod: 'Backspace', def: ['Backspace', 'Delete'] }
  ];
  // ---------- каталог дій для «своїх клавіш» ----------
  var DRAW_NAMES = ['Горизонтальна лінія', 'Вертикальна лінія', 'Промінь', 'Лінії Фібоначчі', 'Віяло Фібоначчі', 'Лінія тренда', 'Паралельний канал', 'Прямокутник', 'Вила Ендрюса'];
  var TF_ALL = ['S5', 'S10', 'S15', 'S30', 'M1', 'M2', 'M3', 'M5', 'M10', 'M15', 'M30', 'H1', 'H4', 'D1'];
  var CAT = [];
  TF_ALL.forEach(function (t) { CAT.push({ id: 'tf:' + t, g: 'Таймфрейм', n: t, run: function () { pcTF(t); } }); });
  CAT.push({ id: 'tf:list', g: 'Таймфрейм', n: 'Відкрити список таймфреймів', run: function () { var o = tfOpener(); if (o) o.click(); } });
  DRAW_NAMES.forEach(function (n, i) { CAT.push({ id: 'draw:' + i, g: 'Малювання', n: n, run: function () { pcDraw(i); } }); });
  CAT.push({ id: 'draw:list', g: 'Малювання', n: 'Відкрити список побудов', run: function () { var b = document.querySelector('.items__link--drawings'); if (b) b.click(); } });
  CAT.push({ id: 'amt:mul', g: 'Угода', n: 'Помножити суму на k', run: function () { amountOp(0); } });
  CAT.push({ id: 'amt:div', g: 'Угода', n: 'Поділити суму на k', run: function () { amountOp(1); } });
  CAT.push({ id: 'mod:send', g: 'Мод', n: 'Надіслати сигнал', run: function () { var t = $('po-send-btn'); if (t) setTimeout(function () { t.click(); }, 0); } });
  CAT.push({ id: 'mod:menu', g: 'Мод', n: 'Відкрити меню моду', run: function () { var t = $('po-settings-btn'); if (t) setTimeout(function () { t.click(); }, 0); } });
  CAT.push({ id: 'snd:all', g: 'Звук', n: 'Звук сигналів увімк. / вимк.', run: function () { setSnd('on', !SND.on); if (SND.on) { ac(); tone([660, 880]); } } });
  CAT.push({ id: 'snd:bb', g: 'Звук', n: 'Звук BB увімк. / вимк.', run: function () { setSnd('bb', !SND.bb); } });
  CAT.push({ id: 'snd:st', g: 'Звук', n: 'Звук ST+CCI увімк. / вимк.', run: function () { setSnd('st', !SND.st); } });
  CAT.push({ id: 'snd:share', g: 'Звук', n: 'Звук сигналів трейдерів увімк. / вимк.', run: function () { setSnd('share', !SND.share); } });
  CAT.push({ id: 'ui:cards', g: 'Інтерфейс', n: 'Сховати / показати картки сигналів', run: function () { toggleHtml('mt-nocards', 'noCards'); } });
  CAT.push({ id: 'ui:bar', g: 'Інтерфейс', n: 'Сховати / показати панель MoonTrade', run: function () { toggleHtml('mt-nobar', 'noBar'); } });
  CAT.push({ id: 'ui:clean', g: 'Інтерфейс', n: 'Чистий інтерфейс увімк. / вимк.', run: function () { OPT.clean = !OPT.clean; lsSet('clean', OPT.clean); applyOpts(); paintSettings(); } });
  CAT.push({ id: 'ui:theme', g: 'Інтерфейс', n: 'Стиль MoonTrade увімк. / вимк.', run: function () { OPT.theme = !OPT.theme; lsSet('theme', OPT.theme); applyOpts(); paintSettings(); } });
  CAT.push({ id: 'ui:header', g: 'Інтерфейс', n: 'Велика назва в хедері увімк. / вимк.', run: function () { var t = document.querySelector('#po-toggle-header .po-toggle') || $('po-toggle-header'); if (t) t.click(); } });
  function catById(id) { for (var i = 0; i < CAT.length; i++) if (CAT[i].id === id) return CAT[i]; return null; }

  var KEYS = lsGet('keys', {});    // перепризначені стандартні: id -> "Alt+S" | null (вимкнено)
  var CUST = lsGet('ckeys', []);   // свої: [{ a: 'tf:H1', k: 'Alt+H' }]
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
  function freeKey(s, except) {   // клавіша може належати лише одній дії
    ACTS.forEach(function (b) { if (b.id !== except && effSigs(b).indexOf(s) > -1) KEYS[b.id] = null; });
    CUST.forEach(function (c, i) { if ('c' + i !== except && c.k === s) c.k = null; });
  }
  function assignKey(id, s) {
    freeKey(s, id);
    if (id.charAt(0) === 'c' && /^c\d+$/.test(id)) { var c = CUST[+id.slice(1)]; if (c) c.k = s; }
    else { var a = actById(id); if (a && a.def[0] === s && a.def.length === 1) delete KEYS[id]; else KEYS[id] = s; }
    lsSet('keys', KEYS); lsSet('ckeys', CUST);
  }
  function runAct(id) {
    var a = actById(id);
    if (a) { modKey(a.mod); return; }
    var c = catById(id);
    if (c) c.run();
  }
  if (PC) window.addEventListener('keydown', function (e) {
    if (passing) return;
    if (capturing) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.key === 'Escape') { capturing = null; paintKeys(); return; }
      if (/^(Shift|Control|Alt|Meta|OS)$/.test(e.key)) return;
      assignKey(capturing, sigOf(e)); capturing = null; paintKeys();
      return;
    }
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    var s = sigOf(e), i, a;
    for (i = 0; i < ACTS.length; i++) {
      a = ACTS[i];
      if (KEYS[a.id] && KEYS[a.id] === s) { e.preventDefault(); e.stopImmediatePropagation(); runAct(a.id); return; }
    }
    for (i = 0; i < CUST.length; i++) {
      if (CUST[i].k && CUST[i].k === s && CUST[i].a) { e.preventDefault(); e.stopImmediatePropagation(); runAct(CUST[i].a); return; }
    }
    // стандартна клавіша, яку перепризначили або вимкнули, більше не спрацьовує
    if (!(e.ctrlKey || e.altKey || e.metaKey)) {
      var plain = s.replace(/^Shift\+/, '');
      for (i = 0; i < ACTS.length; i++) {
        a = ACTS[i];
        if (Object.prototype.hasOwnProperty.call(KEYS, a.id) && a.def.indexOf(plain) > -1) { e.stopImmediatePropagation(); return; }
      }
    }
  }, true);

  // ---------- панель MoonTrade (зверху, можна перетягнути) ----------
  function setupPC() {
    if (!PC || $('mt-bar')) return;
    var bar = el('div', { id: 'mt-bar' });
    bar.innerHTML =
      '<div class="mt-grip" title="Перетягніть панель"></div>' +
      '<button type="button" data-a="send" class="mt-send" title="Надіслати сигнал (поділитися угодою)">📣 Надіслати</button>' +
      '<button type="button" data-a="sound" class="mt-ico"></button>' +
      '<button type="button" data-a="menu" class="mt-ico" title="Меню моду">☰</button>' +
      '<div class="mt-st" id="mt-st"><span class="mt-dot" id="mt-dot"></span><span id="mt-online">—</span></div>';
    document.documentElement.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]');
      if (!b) return;
      e.stopPropagation();
      var a = b.getAttribute('data-a');
      if (a === 'sound') { setSnd('on', !SND.on); if (SND.on) { ac(); tone([660, 880]); } }
      else runAct(a === 'send' ? 'mod:send' : 'mod:menu');
    });
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
    syncBar();
    placeBarSaved();
  }
  function placeBar(x, y) {
    var bar = $('mt-bar');
    if (!bar) return;
    var w = bar.offsetWidth, h = bar.offsetHeight;
    bar.style.left = Math.round(Math.max(4, Math.min(window.innerWidth - w - 4, x))) + 'px';
    bar.style.top = Math.round(Math.max(4, Math.min(window.innerHeight - h - 4, y))) + 'px';
  }
  // початково — у рядку з інструментами PO над графіком (або одразу під ними, якщо не вміщується)
  function barDefault() {
    var bar = $('mt-bar'), tb = document.querySelector('.top-left-block__block1');
    var plot = document.querySelector('canvas.layer.plot') || document.querySelector('.layout-container');
    if (!bar || !tb || !plot) return { x: 100, y: 70 };
    var c = plot.getBoundingClientRect(), r = tb.getBoundingClientRect();
    var w = bar.offsetWidth, h = bar.offsetHeight;
    if (r.right + 12 + w <= c.right - 8) return { x: r.right + 12, y: r.top + (r.height - h) / 2 };
    return { x: r.left, y: r.bottom + 44 };
  }
  function placeBarSaved() {
    var p = lsGet('barPos', null) || barDefault();
    placeBar(p.x, p.y);
  }
  function syncBar() {
    var bar = $('mt-bar');
    if (!bar) return;
    var sb = bar.querySelector('[data-a="sound"]');
    if (sb) { sb.textContent = SND.on ? '🔊' : '🔇'; sb.classList.toggle('mt-off', !SND.on); sb.title = SND.on ? 'Звук сигналів увімкнений' : 'Звук сигналів вимкнений'; }
    var on = wsOnline(), dot = $('mt-dot');
    if (dot) dot.classList.toggle('on', on);
    var oc = $('po-online-count'), mo = $('mt-online'), st = $('mt-st');
    var t = oc ? (oc.textContent || '').replace(/\s*online/i, '').trim() : '';
    if (mo) mo.textContent = on ? (t ? t + ' онлайн' : 'онлайн') : 'офлайн';
    if (st) st.title = on ? 'Мод підключений до сервера' + (t ? ' · трейдерів онлайн: ' + t : '') : 'Немає з’єднання з сервером моду';
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
    if (n.id === 'po-toggle-header' || n.id === 'po-toggle-hud') return 'ui';
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
        r.querySelector('button').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); lsSet('barPos', null); document.documentElement.classList.remove('mt-nobar'); lsSet('noBar', false); placeBarSaved(); });
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
        '<label data-s="on"><span>Звук сигналів<small>Головний вимикач. Чути, навіть коли вкладка неактивна</small></span><span class="mt-sw"></span></label>' +
        '<div class="mt-snd-row"><label data-s="bb"><span>Bollinger (BB)<small>Дзвіночок: дотик — 1 тон, лінія — 2, вхід — 3</small></span><span class="mt-sw"></span></label><button type="button" data-t="bb" title="Прослухати">▶</button></div>' +
        '<div class="mt-snd-row"><label data-s="st"><span>SuperTrend + CCI<small>М’якший тембр: відкат — 2 тони, вхід — 4</small></span><span class="mt-sw"></span></label><button type="button" data-t="st" title="Прослухати">▶</button></div>' +
        '<div class="mt-snd-row"><label data-s="share"><span>Сигнали від трейдерів<small>«Дінь-дон»</small></span><span class="mt-sw"></span></label><button type="button" data-t="share" title="Прослухати">▶</button></div>' +
        '<div class="mt-vol"><span>Гучність</span><input type="range" min="5" max="100" step="5"><b></b></div>';
      p.addEventListener('click', function (e) {
        var lb = e.target.closest('label[data-s]'), tb = e.target.closest('button[data-t]');
        if (lb) { e.preventDefault(); e.stopPropagation(); var k = lb.getAttribute('data-s'); setSnd(k, !SND[k]); }
        if (tb) { e.preventDefault(); e.stopPropagation(); ac(); var t = tb.getAttribute('data-t'); playSignal(t, 'entry', true); }
      });
      var rg = p.querySelector('input[type=range]');
      rg.addEventListener('input', function () { SND.vol = +rg.value; lsSet('sndVol', SND.vol); paintSound(); });
      rg.addEventListener('change', function () { ac(); playSignal('bb', 'soft', true); });
      md.insertBefore(p, body.nextSibling);
    }
    paintSound();
  }
  function paintSound() {
    var p = $('mt-snd');
    if (!p) return;
    [].slice.call(p.querySelectorAll('label[data-s]')).forEach(function (lb) { lb.querySelector('.mt-sw').classList.toggle('on', !!SND[lb.getAttribute('data-s')]); });
    p.classList.toggle('mt-muted', !SND.on);
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
        var id = b.getAttribute('data-id'), k = b.getAttribute('data-k');
        if (b.classList.contains('mt-kb')) { capturing = capturing === id ? null : id; }
        else if (b.classList.contains('mt-kr')) {
          if (/^c\d+$/.test(id)) CUST.splice(+id.slice(1), 1); else delete KEYS[id];
          capturing = null;
        }
        else if (k === 'add') { CUST.push({ a: '', k: null }); capturing = null; }
        else if (k === 'all') { KEYS = {}; capturing = null; }
        lsSet('keys', KEYS); lsSet('ckeys', CUST);
        paintKeys();
      });
      p.addEventListener('change', function (e) {
        var s = e.target.closest('select[data-ci]');
        if (!s) return;
        var c = CUST[+s.getAttribute('data-ci')];
        if (c) { c.a = s.value; lsSet('ckeys', CUST); }
        paintKeys();
      });
      md.insertBefore(p, ($('mt-snd') || body).nextSibling);
    }
    paintKeys();
  }
  function catOptions(sel) {
    var groups = [], seen = {};
    CAT.forEach(function (c) { if (!seen[c.g]) { seen[c.g] = 1; groups.push(c.g); } });
    return '<option value="">— оберіть дію —</option>' + groups.map(function (g) {
      return '<optgroup label="' + g + '">' + CAT.filter(function (c) { return c.g === g; }).map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + c.n + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }
  function paintKeys() {
    var p = $('mt-keys');
    if (!p) return;
    var html = '<div class="mt-h">Гарячі клавіші моду</div><div class="mt-note">Натисніть на клавішу праворуч і задайте свою комбінацію (можна з Ctrl, Alt, Shift). Esc — скасувати. ↺ — повернути стандартну.</div>' +
      ACTS.map(function (a) {
        var s = effSigs(a), changed = Object.prototype.hasOwnProperty.call(KEYS, a.id);
        var lbl = capturing === a.id ? 'Натисніть…' : (s.length ? s.map(sigLabel).join(' / ') : '—');
        return '<div class="mt-k' + (changed ? ' mt-ch' : '') + '"><span>' + a.n + '</span>' +
          '<button type="button" class="mt-kb' + (capturing === a.id ? ' mt-wait' : '') + '" data-id="' + a.id + '">' + lbl + '</button>' +
          '<button type="button" class="mt-kr" data-id="' + a.id + '" title="Повернути стандартну"' + (changed ? '' : ' disabled') + '>↺</button></div>';
      }).join('') +
      '<div class="mt-btnrow"><span>Стандартні клавіші</span><button type="button" data-k="all">Скинути до стандартних</button></div>' +
      '<div class="mt-h mt-h2">Свої клавіші</div><div class="mt-note">Додайте клавішу для будь-якої дії: таймфрейми S5–D1, усі інструменти малювання, множник суми, звук, інтерфейс.</div>' +
      CUST.map(function (c, i) {
        var id = 'c' + i, lbl = capturing === id ? 'Натисніть…' : (c.k ? sigLabel(c.k) : 'Задати');
        return '<div class="mt-k mt-ck"><select data-ci="' + i + '">' + catOptions(c.a) + '</select>' +
          '<button type="button" class="mt-kb' + (capturing === id ? ' mt-wait' : '') + (c.k ? '' : ' mt-empty') + '" data-id="' + id + '">' + lbl + '</button>' +
          '<button type="button" class="mt-kr" data-id="' + id + '" title="Видалити">×</button></div>';
      }).join('') +
      '<div class="mt-btnrow"><span></span><button type="button" data-k="add" class="mt-add">+ Додати клавішу</button></div>';
    if (p.getAttribute('data-h') !== html) { p.innerHTML = html; p.setAttribute('data-h', html); }
  }

  // ---------- «Угоди» на ПК: підсумок за сьогодні над вкладками ----------
  var sumCache = '';
  function syncTradesPC() {
    var slot = document.querySelector('.widget-slot.deals');
    var sum = $('mt-sum');
    if (!slot || !OPT.theme) { if (sum) sum.remove(); return; }
    var hdr = slot.querySelector('.widget-slot__header'), div = hdr && hdr.querySelector('.divider');
    var list = slot.querySelector('.deals-list');
    var act = hdr && hdr.querySelector('.divider li.active');
    if (list && act && /Закрит|Closed|Закрыт/i.test(act.textContent)) sumCache = todayHtml(list);
    if (!sumCache || !div) { if (sum) sum.remove(); return; }
    if (!sum) sum = el('div', { id: 'mt-sum' });
    if (sum.nextSibling !== div) hdr.insertBefore(sum, div);
    if (sum.getAttribute('data-h') !== sumCache) { sum.innerHTML = sumCache; sum.setAttribute('data-h', sumCache); }
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
