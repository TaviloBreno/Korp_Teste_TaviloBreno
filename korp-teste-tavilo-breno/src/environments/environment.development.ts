/**
 * Configurações de ambiente de desenvolvimento
 * 
 * Para simular falha de microsserviço, altere mockDownService:
 * - null: todos os serviços funcionam normalmente
 * - 'inventory': simula falha do serviço de inventário
 * - 'billing': simula falha do serviço de faturamento
 * 
 * Exemplo: mockDownService: 'inventory' as 'inventory' | 'billing'
 */
export const environment = {
  production: false,
  inventoryApiUrl: 'http://localhost:3000/inventory',
  billingApiUrl: 'http://localhost:3001/billing',
  retryAttempts: 3,
  retryDelayMs: 1000,
  // Altere para 'inventory' ou 'billing' para simular falha
  mockDownService: null as 'inventory' | 'billing' | null,
};
