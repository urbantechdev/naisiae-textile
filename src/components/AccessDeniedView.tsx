import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  ShoppingCart,
  LayoutDashboard,
  Layers,
  Receipt,
  FileCheck,
  Tag,
  CheckCircle2
} from 'lucide-react';
import {
  VIEW_METADATA,
  ROLE_DEFINITIONS,
  getDefaultViewForRole,
} from '../utils/permissions';
import { UserRole } from '../types';
import { AnimatedErrorCross } from '../context/NotificationContext';

interface AccessDeniedViewProps {
  attemptedView: string;
  onNavigate: (view: string) => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  attemptedView,
  onNavigate,
}) => {
  const { user } = useAuth();
  const currentRole: UserRole = user?.role || 'STAFF';
  const roleMeta = ROLE_DEFINITIONS[currentRole];
  const viewMeta = VIEW_METADATA[attemptedView] || {
    title: attemptedView,
    category: 'Restricted Module',
    requiredRoles: ['ADMIN'],
    description: 'This operational area requires elevated security permissions.',
  };

  const defaultLanding = getDefaultViewForRole(currentRole);

  const roleAvailableShortcuts = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart },
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Branch Inventory', icon: Layers },
    { id: 'products', label: 'Uniform Catalog', icon: Tag },
    { id: 'receipts', label: 'Sales Receipts', icon: Receipt },
    { id: 'quotations', label: 'Quotations', icon: FileCheck },
  ].filter((item) => roleMeta?.allowedViews.includes(item.id));

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        {/* Top Warning Strip */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <AnimatedErrorCross size={34} />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[#FACB00] text-[10px] font-black uppercase tracking-wider mb-2 border border-white/20">
                Security Policy Enforcement
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Module Access Restricted
              </h2>
              <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-lg">
                Your user role is strictly configured to only view modules and data that fit your assigned responsibilities.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User Current Role */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Your Current Role
              </span>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${roleMeta?.badgeColorClass}`}
                >
                  {roleMeta?.badgeLabel || currentRole}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {roleMeta?.summary}
              </p>
            </div>

            {/* Target Module Requirements */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Attempted View
              </span>
              <h4 className="text-sm font-black text-slate-800 flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                {viewMeta.title}
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                {viewMeta.description}
              </p>
              <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-amber-900">Requires:</span>
                <span className="text-[10px] font-mono font-bold text-amber-800">
                  {viewMeta.requiredRoles.join(' or ')}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start space-x-3 text-xs text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-[#030A91] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#030A91]">Role-Based Access Control (RBAC) Active</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                If you believe your duties require access to <strong>{viewMeta.title}</strong>, please contact your System Administrator to update your user role privileges in the Staff Administration directory.
              </p>
            </div>
          </div>

          {/* Available Modules for Role */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Modules Fitted to Your Role ({roleAvailableShortcuts.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roleAvailableShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-all group"
                  >
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#030A91] transition-colors mb-1.5" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#030A91] block truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => onNavigate(defaultLanding)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#030A91] hover:bg-blue-900 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Return to {defaultLanding === 'pos' ? 'POS Terminal' : 'Dashboard'}</span>
              <ArrowRight className="w-4 h-4 text-[#FACB00]" />
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              User ID: {user?.email || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
