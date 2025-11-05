/**
 * Testowe konta użytkowników (tylko dla środowiska deweloperskiego)
 */

export interface TestAccount {
  email: string;
  password: string;
  label: string;
  icon: string;
  role: 'agent' | 'user';
}

export const testAccounts: TestAccount[] = [
  { email: 'admin@tickflow.com', password: 'Admin123!@#', label: 'admin@tickflow.com / Admin123!@#', icon: '👨‍💼', role: 'agent' },
  { email: 'agent@tickflow.com', password: 'Agent123!@#', label: 'agent@tickflow.com / Agent123!@#', icon: '👨‍💼', role: 'agent' },
  { email: 'agent2@tickflow.com', password: 'Agent2123!@#', label: 'agent2@tickflow.com / Agent2123!@#', icon: '👩‍💼', role: 'agent' },
  { email: 'user@tickflow.com', password: 'User123!@#', label: 'user@tickflow.com / User123!@#', icon: '👤', role: 'user' },
  { email: 'user2@tickflow.com', password: 'User2123!@#', label: 'user2@tickflow.com / User2123!@#', icon: '👤', role: 'user' },
];

export const agentAccounts = testAccounts.filter(acc => acc.role === 'agent');
export const userAccounts = testAccounts.filter(acc => acc.role === 'user');

/**
 * Testowe konta produkcyjne (widoczne również na produkcji dla testerów)
 */
export const productionTestAccounts: TestAccount[] = [
  { email: 'agent@tickflow.com', password: 'Agent123!@#', label: 'agent@tickflow.com / Agent123!@#', icon: '👨‍💼', role: 'agent' },
  { email: 'user@tickflow.com', password: 'User123!@#', label: 'user@tickflow.com / User123!@#', icon: '👤', role: 'user' },
];

export const productionAgentAccounts = productionTestAccounts.filter(acc => acc.role === 'agent');
export const productionUserAccounts = productionTestAccounts.filter(acc => acc.role === 'user');
