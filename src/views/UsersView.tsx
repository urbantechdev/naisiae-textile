import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Branch } from '../types';
import { useNotification } from '../context/NotificationContext';
import { UserCheck, Plus, Search, Shield, Lock, X } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const UsersView: React.FC = () => {
  const { notify } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('123456');
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'STAFF'>('STAFF');
  const [branchId, setBranchId] = useState('all');
  const [phone, setPhone] = useState('');

  const fetchUsers = async () => {
    try {
      const [uList, bList] = await Promise.all([api.getUsers(), api.getBranches()]);
      setUsers(uList);
      setBranches(bList);
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Error', message: err.message });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        name,
        email,
        password,
        pin: pin || '123456',
        role,
        branchId,
        phone,
      });

      notify({ type: 'SUCCESS', title: 'User Created', message: `${name} (${role}) added with PIN ${pin || '123456'}.` });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPin('123456');
      fetchUsers();
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Error', message: err.message });
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateUser(user.id, { status: newStatus });
      notify({
        type: 'SUCCESS',
        title: 'Status Updated',
        message: `${user.name} is now ${newStatus}.`,
      });
      fetchUsers();
    } catch (err: any) {
      notify({ type: 'ERROR', title: 'Update Failed', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            User Roles & Staff Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage ERP access, assign branch stations, and enforce role-based access control.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#030A91] text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5 text-[#FACB00]" />
          <span>Add System User</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Assigned Branch Station</th>
                <th className="py-3 px-3">POS 6-Digit PIN</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const b = branches.find((br) => br.id === u.branchId);
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-100 text-[#030A91]'
                            : u.role === 'ACCOUNTANT'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {u.branchId === 'all' ? 'All Branches (HQ Access)' : b?.name || u.branchId}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-xs text-[#030A91]">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                        {u.pin || '123456'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.phone || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Access Matrix & Security Scope Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center">
              <Shield className="w-5 h-5 mr-2 text-[#030A91]" />
              Role Access Matrix & View Permissions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforced by Role-Based Access Control (RBAC): Users only view what strictly fits their role.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            <Lock className="w-3 h-3 mr-1 text-emerald-600" />
            Security Active
          </span>
        </div>

        {/* Role Cards Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Admin Card */}
          <div className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                ADMIN
              </span>
              <span className="text-[11px] font-black font-mono text-amber-800">17 of 17 Modules</span>
            </div>
            <h4 className="font-black text-sm text-slate-900">System Administrator</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Full executive authority across all stores, branch context switching, user provisioning, system parameters, audit trail, and complete financial reporting.
            </p>
            <div className="pt-2 border-t border-amber-200/60 text-[10px] text-amber-900 font-semibold">
              ✓ Unrestricted access to all views & actions
            </div>
          </div>

          {/* Accountant Card */}
          <div className="p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                ACCOUNTANT
              </span>
              <span className="text-[11px] font-black font-mono text-emerald-800">14 of 17 Modules</span>
            </div>
            <h4 className="font-black text-sm text-slate-900">Chief Accountant & Controller</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Financial statements, P&L reports, VAT returns, KRA eTIMS console, invoices, receivables, supplier payables, expense ledgers, and stock valuation audits.
            </p>
            <div className="pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-900 font-semibold">
              ✕ Excluded from User Roles & System Settings
            </div>
          </div>

          {/* Staff Card */}
          <div className="p-4 rounded-2xl border border-blue-200/90 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                STAFF
              </span>
              <span className="text-[11px] font-black font-mono text-blue-800">8 of 17 Modules</span>
            </div>
            <h4 className="font-black text-sm text-slate-900">Store Staff & POS Cashier</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Retail checkout terminal, daily shift sales, past sales receipts, uniform garment sizing catalog, branch inventory checks, stock transfers, and quotations.
            </p>
            <div className="pt-2 border-t border-blue-200/60 text-[10px] text-rose-700 font-semibold">
              ✕ Blocked: Invoices, P&L Financials, Expenses, Cost Prices
            </div>
          </div>
        </div>

        {/* Matrix Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">ERP Functional Module</th>
                <th className="py-2.5 px-3 text-center">Staff / Cashier</th>
                <th className="py-2.5 px-3 text-center">Accountant</th>
                <th className="py-2.5 px-3 text-center">Administrator</th>
                <th className="py-2.5 px-3">Access Scope & Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">POS Terminal & Sales</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="py-2.5 px-3 text-slate-500">Retail checkout, barcode scan & payment receipt</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-800">Operations Dashboard</td>
                <td className="py-2.5 px-3 text-center text-blue-700 font-bold">✓ Shift Tools</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Financials</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Executive</td>
                <td className="py-2.5 px-3 text-slate-500">Shift sales for Staff; Net Profit & Margins for Admin/Accounts</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Uniform Catalog & Sizes</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Retail Sizing</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Margins/Price</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Manage</td>
                <td className="py-2.5 px-3 text-slate-500">Staff views retail prices & photos; costs masked from Staff</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-800">Branch Inventory & Stock</td>
                <td className="py-2.5 px-3 text-center text-blue-700 font-bold">✓ Stock Check</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Valuation Audit</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Adjust</td>
                <td className="py-2.5 px-3 text-slate-500">Staff checks available quantity; cost valuation restricted</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Commercial Invoices</td>
                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">✕ Access Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Billing</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Billing</td>
                <td className="py-2.5 px-3 text-slate-500">B2B institutional invoices, credit terms & receivables</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-800">Purchases & Expenses</td>
                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">✕ Access Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Manage</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Manage</td>
                <td className="py-2.5 px-3 text-slate-500">Vendor purchase orders, operating costs & supplier payables</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-800">Financial Reports & KRA eTIMS</td>
                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">✕ Access Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Tax & P&L</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Tax & P&L</td>
                <td className="py-2.5 px-3 text-slate-500">Profit & Loss statements, VAT returns, and KRA transmissions</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-800">User Administration & Settings</td>
                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">✕ Access Denied</td>
                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">✕ Access Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Admin</td>
                <td className="py-2.5 px-3 text-slate-500">Staff roles, security credentials, audit logs & system config</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-[#030A91] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New ERP User</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samuel Mutua"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Email Address:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.mutua@naisiaetextiles.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    System Role:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="STAFF">Staff / POS Cashier (8 Modules)</option>
                    <option value="ACCOUNTANT">Chief Accountant (14 Modules)</option>
                    <option value="ADMIN">System Administrator (Full 17 Modules)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Assigned Branch:
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="all">All Branches (HQ)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Role Access Preview Callout */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Permissions Granted for {role}:
                </span>
                {role === 'STAFF' && (
                  <p className="text-slate-600 leading-snug">
                    <span className="font-semibold text-[#030A91]">Fitted Views:</span> POS Terminal, Shift Dashboard, Sales Receipts, Sizing Catalog, Branch Stock Check, Stock Transfers, Quotations, and Customers.
                    <br />
                    <span className="text-rose-600 font-semibold">Strictly Blocked:</span> Commercial Invoices, Expense Ledgers, Purchases, P&L Financials, Cost Prices, and System Settings.
                  </p>
                )}
                {role === 'ACCOUNTANT' && (
                  <p className="text-slate-600 leading-snug">
                    <span className="font-semibold text-emerald-800">Fitted Views:</span> Invoices, Quotations, Customers, Suppliers, Purchases, Expenses, Financial P&L Reports, KRA eTIMS Fiscal Center, Stock Valuation, Transfers, and POS.
                    <br />
                    <span className="text-amber-700 font-semibold">Blocked:</span> User Administration & System Settings.
                  </p>
                )}
                {role === 'ADMIN' && (
                  <p className="text-slate-600 leading-snug">
                    <span className="font-semibold text-amber-800">Full Unrestricted Access:</span> All 17 ERP modules across all retail branch stations and HQ.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Phone:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Assigned 6-Digit POS PIN:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl tracking-widest text-[#030A91]"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Used by staff cashiers to unlock the POS retail checkout terminal.</p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#030A91] text-white text-xs font-bold hover:bg-blue-900"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
