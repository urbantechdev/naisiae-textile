import { UserRole } from '../types';

export interface RoleMeta {
  role: UserRole;
  label: string;
  badgeLabel: string;
  badgeColorClass: string;
  summary: string;
  description: string;
  defaultView: string;
  allowedViews: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleMeta> = {
  ADMIN: {
    role: 'ADMIN',
    label: 'System Administrator',
    badgeLabel: 'Administrator',
    badgeColorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    summary: 'Full executive control across all stores, finances, staff accounts, and configurations.',
    description:
      'Unrestricted administrative access to all 17 ERP modules, including branch switching, user role provisioning, system settings, financial ledgers, and audit security.',
    defaultView: 'dashboard',
    allowedViews: [
      'pos',
      'dashboard',
      'inventory',
      'transfers',
      'products',
      'invoices',
      'quotations',
      'receipts',
      'customers',
      'suppliers',
      'purchases',
      'expenses',
      'financials',
      'kra',
      'users',
      'audit',
      'settings',
    ],
  },
  ACCOUNTANT: {
    role: 'ACCOUNTANT',
    label: 'Chief Accountant & Controller',
    badgeLabel: 'Accountant',
    badgeColorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    summary: 'Financial management, P&L statements, tax compliance, invoices, payables, and stock audit.',
    description:
      'Access to financial ledgers, tax filings, KRA eTIMS, customer billing, purchase orders, expenses, and inventory valuation. Excluded from system administration and user management.',
    defaultView: 'dashboard',
    allowedViews: [
      'dashboard',
      'invoices',
      'quotations',
      'customers',
      'receipts',
      'suppliers',
      'purchases',
      'expenses',
      'financials',
      'kra',
      'inventory',
      'products',
      'transfers',
      'pos',
    ],
  },
  STAFF: {
    role: 'STAFF',
    label: 'Store Staff & POS Cashier',
    badgeLabel: 'Storefront Staff',
    badgeColorClass: 'bg-blue-100 text-blue-900 border-blue-300',
    summary: 'Point-of-sale terminal, customer receipts, uniform sizing catalog, and branch stock checks.',
    description:
      'Frontline store access focused on retail checkout, receipt reprinting, uniform catalog assistance, stock verification, and quotations. Restricted from financial statements, invoices, expenses, cost pricing, and administration.',
    defaultView: 'pos',
    allowedViews: [
      'pos',
      'dashboard',
      'receipts',
      'inventory',
      'products',
      'transfers',
      'quotations',
      'customers',
    ],
  },
};

export const VIEW_METADATA: Record<
  string,
  {
    title: string;
    category: string;
    requiredRoles: UserRole[];
    description: string;
  }
> = {
  pos: {
    title: 'POS Terminal',
    category: 'Retail & POS',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Direct customer checkout, barcode scanning, MPESA/Cash receipting.',
  },
  dashboard: {
    title: 'Executive & Shift Dashboard',
    category: 'Retail & POS',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Role-tailored operations dashboard showing daily sales and metrics.',
  },
  receipts: {
    title: 'Sales Receipts',
    category: 'Retail & POS',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Past sales transactions, reprint slips, and proof of payment.',
  },
  inventory: {
    title: 'Branch Inventory',
    category: 'Uniforms & Stock',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Stock levels, low-stock reorder thresholds, and physical stocktake.',
  },
  products: {
    title: 'Uniform Catalog',
    category: 'Uniforms & Stock',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'School garments, sizing variations, retail pricing, and photos.',
  },
  transfers: {
    title: 'Stock Transfers',
    category: 'Uniforms & Stock',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Inter-branch stock dispatch, receipt, and transit logs.',
  },
  quotations: {
    title: 'Quotations',
    category: 'Billing & Accounts',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Issue pro-forma quotes to parents and schools for uniforms.',
  },
  customers: {
    title: 'Customers & Schools',
    category: 'Billing & Accounts',
    requiredRoles: ['STAFF', 'ACCOUNTANT', 'ADMIN'],
    description: 'Customer contact records, institution addresses, and history.',
  },
  invoices: {
    title: 'Commercial Invoices',
    category: 'Billing & Accounts',
    requiredRoles: ['ACCOUNTANT', 'ADMIN'],
    description: 'Institutional invoicing, accounts receivable, and credit terms.',
  },
  suppliers: {
    title: 'Suppliers & Vendors',
    category: 'Purchases & Finance',
    requiredRoles: ['ACCOUNTANT', 'ADMIN'],
    description: 'Textile mills, garment manufacturers, and vendor contacts.',
  },
  purchases: {
    title: 'Purchase Orders',
    category: 'Purchases & Finance',
    requiredRoles: ['ACCOUNTANT', 'ADMIN'],
    description: 'Procurement orders, bills, and stock receiving.',
  },
  expenses: {
    title: 'Expense Ledger',
    category: 'Purchases & Finance',
    requiredRoles: ['ACCOUNTANT', 'ADMIN'],
    description: 'Operational expenses, utilities, payroll, and branch costs.',
  },
  financials: {
    title: 'Financial Reports',
    category: 'Purchases & Finance',
    requiredRoles: ['ACCOUNTANT', 'ADMIN'],
    description: 'Profit & Loss statements, gross margins, and VAT returns.',
  },
  kra: {
    title: 'KRA eTIMS Center',
    category: 'Purchases & Finance',
    requiredRoles: ['ACCOUNTANT', 'ADMIN'],
    description: 'Tax compliance, fiscalization queue, and electronic transmissions.',
  },
  users: {
    title: 'Staff & Roles',
    category: 'Administration',
    requiredRoles: ['ADMIN'],
    description: 'User accounts, role assignments, station PINs, and security.',
  },
  audit: {
    title: 'Audit Trail',
    category: 'Administration',
    requiredRoles: ['ADMIN'],
    description: 'Immutable system audit logs and security events.',
  },
  settings: {
    title: 'System Settings',
    category: 'Administration',
    requiredRoles: ['ADMIN'],
    description: 'Enterprise configurations, KRA parameters, and database backup.',
  },
};

export function isViewAllowedForRole(role: UserRole | undefined, viewId: string): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  const config = ROLE_DEFINITIONS[role];
  if (!config) return false;
  return config.allowedViews.includes(viewId);
}

export function getDefaultViewForRole(role: UserRole | undefined): string {
  if (!role) return 'pos';
  return ROLE_DEFINITIONS[role]?.defaultView || 'pos';
}

export function getRequiredRolesForView(viewId: string): UserRole[] {
  return VIEW_METADATA[viewId]?.requiredRoles || ['ADMIN'];
}
