const CONFIG = {
  storeUrl: 'https://charriol-geneve.myshopify.com',
  accessToken: 'b54f4f45a4e83458cd38eb0b5e15fc85',
  collectionHandle: 'ambers-design',
  
  // GESTION DEVISES
  enableCurrencyConversion: false,    // ← FALSE (pas de conversion)
  useMsrpMetafield: true,             // ← NOUVEAU : utiliser le metafield MSRP
  msrpMetafieldKey: 'msrp_amber_s_design', // ← Le key du metafield
  sourceCurrency: 'CHF',
  targetCurrency: 'USD',
  exchangeRate: 1.08,
};
