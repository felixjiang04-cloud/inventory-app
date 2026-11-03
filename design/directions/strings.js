// Text and sample data for the mockups. The strings are copied from the
// app's translations (frontend/src/i18n/en.json, fr.json, zh.json), so every
// direction shows the real wording in all three languages.
/* global window */

window.MOCK_STRINGS = {
  en: {
    appTitle: 'Restaurant Inventory',
    nav: { main: 'Main menu', home: 'Home', add: 'Add', check: 'Check', stock: 'Stock', more: 'More' },
    home: {
      title: 'To do',
      addInvoice: 'Add an invoice',
      typeInstead: 'Or type one in',
      allClear: 'Nothing waiting. When an invoice arrives, add it with the button above.',
      recent: 'Recently added to stock',
      seeAllPosted: 'All invoices added to stock',
      invoicesToCheck: '{{count}} invoices to check',
      invoicesToCheckHint: 'Confirm the lines, then add them to stock',
    },
    stock: {
      title: 'Stock',
      search: 'Search items',
      lastDelivery: 'Last delivery {{date}}',
      spent: '{{amount}} spent',
    },
    quantity: 'quantity',
    allConfirmed: 'All lines confirmed',
    network: 'Could not reach the server. Check your connection and try again.',
  },
  fr: {
    appTitle: 'Inventaire Restaurant',
    nav: { main: 'Menu principal', home: 'Accueil', add: 'Ajouter', check: 'Vérifier', stock: 'Stock', more: 'Plus' },
    home: {
      title: 'À faire',
      addInvoice: 'Ajouter une facture',
      typeInstead: 'Ou la saisir à la main',
      allClear: 'Rien en attente. Quand une facture arrive, ajoutez-la avec le bouton ci-dessus.',
      recent: 'Ajoutées récemment au stock',
      seeAllPosted: 'Toutes les factures ajoutées au stock',
      invoicesToCheck: '{{count}} factures à vérifier',
      invoicesToCheckHint: 'Confirmez les lignes, puis ajoutez-les au stock',
    },
    stock: {
      title: 'Stock',
      search: 'Chercher un article',
      lastDelivery: 'Dernière livraison le {{date}}',
      spent: '{{amount}} dépensés',
    },
    quantity: 'quantité',
    allConfirmed: 'Toutes les lignes sont confirmées',
    network: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
  },
  zh: {
    appTitle: '餐厅库存',
    nav: { main: '主菜单', home: '首页', add: '添加', check: '核对', stock: '库存', more: '更多' },
    home: {
      title: '待办',
      addInvoice: '添加发票',
      typeInstead: '或手动录入',
      allClear: '目前没有待办事项。收到发票后，用上方按钮添加。',
      recent: '最近入库',
      seeAllPosted: '所有已入库发票',
      invoicesToCheck: '{{count}} 张发票待核对',
      invoicesToCheckHint: '确认各行后即可入库',
    },
    stock: {
      title: '库存',
      search: '搜索货品',
      lastDelivery: '最近到货：{{date}}',
      spent: '已花费 {{amount}}',
    },
    quantity: '数量',
    allConfirmed: '所有行已确认',
    network: '无法连接服务器，请检查网络后重试。',
  },
}

// The same example data in every direction. Amounts are integer cents and
// quantities whole grams / millilitres, exactly as the ledger API returns them.
window.MOCK_DATA = {
  recent: [
    { supplier: 'Marché Bonanza', date: '2026-07-19', cents: 1500 },
    { supplier: 'Marché Bonanza', date: '2026-07-18', cents: 6324 },
  ],
  stock: [
    { name: "Huile d'olive", qty: 3000, unit: 'ml', spentCents: 2500, lastDelivery: '2026-07-18' },
    { name: 'Tomates Roma', qty: 15000, unit: 'g', spentCents: 4500, lastDelivery: '2026-07-19' },
  ],
}

// Display formatting, with the same Intl settings as frontend/src/format.ts.
;(function () {
  const LOCALES = { en: 'en-CA', fr: 'fr-CA', zh: 'zh-CN' }
  const locale = (lang) => LOCALES[lang] || 'en-CA'
  const DISPLAY_UNITS = { g: { unit: 'kg', per: 1000 }, ml: { unit: 'L', per: 1000 } }

  window.MOCK_FORMAT = {
    money(cents, lang) {
      return new Intl.NumberFormat(locale(lang), { style: 'currency', currency: 'CAD' }).format(
        cents / 100,
      )
    },
    qty(qty, baseUnit, lang) {
      const bigger = DISPLAY_UNITS[baseUnit]
      if (bigger && Math.abs(qty) >= bigger.per) {
        const value = new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 3 }).format(
          qty / bigger.per,
        )
        return `${value} ${bigger.unit}`
      }
      return `${new Intl.NumberFormat(locale(lang)).format(qty)} ${baseUnit}`
    },
    date(isoDate, lang) {
      const [year, month, day] = isoDate.split('-').map(Number)
      return new Intl.DateTimeFormat(locale(lang), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(year, month - 1, day)))
    },
  }
})()

// The app's five navigation icons (frontend/src/components/Icon.tsx).
window.MOCK_ICONS = {
  home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/>',
  add: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  check: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="m9 12 2 2 4-4"/>',
  stock: '<path d="M4 8 12 4l8 4v8l-8 4-8-4z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
  more: '<path d="M5 7h14M5 12h14M5 17h14"/>',
}

// The app's logo (frontend/public/favicon.svg), coloured from the tokens.
window.MOCK_BRAND_MARK =
  '<svg class="brand-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">' +
  '<rect class="bm-tile" width="32" height="32" rx="6"/>' +
  '<rect class="bm-paper" x="8" y="7" width="16" height="18" rx="2"/>' +
  '<rect class="bm-line" x="11" y="11" width="10" height="2" rx="1"/>' +
  '<rect class="bm-line" x="11" y="15" width="7" height="2" rx="1"/>' +
  '<rect class="bm-line" x="11" y="19" width="10" height="2" rx="1"/>' +
  '</svg>'
