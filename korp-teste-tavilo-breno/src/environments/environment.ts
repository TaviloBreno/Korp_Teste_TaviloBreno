export const environment = {
  production: true,
  inventoryApiUrl: 'https://api.korp.test/inventory',
  billingApiUrl: 'https://api.korp.test/billing',
  retryAttempts: 3,
  retryDelayMs: 1000,
  mockDownService: null as 'inventory' | 'billing' | null,
};
