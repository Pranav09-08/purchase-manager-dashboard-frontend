// Shared dashboard shell for vendor and purchase manager
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function DashboardLayout({ 
  userType = 'vendor', 
  userName = 'User',
  userProfile = null,
  children, 
  currentPage = 'Dashboard',
  pageDescription = '',
  paymentReceiptCount = 0,
  enquiriesCount = 0,
  loisCount = 0,
  ordersCount = 0,
  invoicesCount = 0
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  // Toggle for compact sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Clear session and redirect
  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
      // Sign out from Firebase
      await logout();
      
      // Clear old localStorage tokens (backward compatibility)
      if (userType === 'vendor') {
        localStorage.removeItem('token');
        localStorage.removeItem('vendor');
        navigate('/login');
      } else {
        localStorage.removeItem('purchaseManagerToken');
        localStorage.removeItem('purchaseManagerUser');
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if Firebase logout fails
      navigate(userType === 'vendor' ? '/login' : '/login');
    }
  };

  // Emit a dashboard navigation event (handled by pages)
  const navigateTo = (page) => {
    window.dispatchEvent(new CustomEvent('dashboardPageChange', { detail: { page } }));
  };

  const profile = userProfile || {
    name: userName,
    role: userType === 'vendor' ? 'Vendor' : 'Purchase Manager',
    email: '',
    company: '',
  };

  const initials = (profile.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const headerOffsetClass = sidebarCollapsed ? 'left-20' : 'left-56';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-20 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-56'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {!sidebarCollapsed && <span className="text-base font-bold text-slate-100">Dashboard</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-2 space-y-2 mt-2">
          {userType === 'vendor' ? (
            <>
              {!sidebarCollapsed && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Overview
                </div>
              )}
              <button 
                onClick={() => navigateTo('overview')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                {!sidebarCollapsed && <span>Overview</span>}
              </button>

              <button 
                onClick={() => navigateTo('analytics')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                {!sidebarCollapsed && <span>Analytics</span>}
              </button>

              <button 
                onClick={() => navigateTo('components')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {!sidebarCollapsed && <span>Components</span>}
              </button>

              {!sidebarCollapsed && (
                <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Procurement
                </div>
              )}

              <button 
                onClick={() => navigateTo('enquiries')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Enquiries</span>
                    {enquiriesCount > 0 && (
                      <span className="ml-2 rounded-full bg-amber-500/20 text-amber-200 text-[11px] font-semibold px-2 py-0.5">
                        {enquiriesCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button 
                onClick={() => navigateTo('quotations')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {!sidebarCollapsed && <span>Quotations</span>}
              </button>

              <button 
                onClick={() => navigateTo('lois')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                  <path d="M12 8V7m0 1v8m0 0v1" />
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>LOIs</span>
                    {loisCount > 0 && (
                      <span className="ml-2 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-semibold px-2 py-0.5">
                        {loisCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button 
                onClick={() => navigateTo('orders')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Orders</span>
                    {ordersCount > 0 && (
                      <span className="ml-2 rounded-full bg-violet-500/20 text-violet-200 text-[11px] font-semibold px-2 py-0.5">
                        {ordersCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button 
                onClick={() => navigateTo('invoices')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 14h6m-6 4h6" />
                  <path d="M7 3h8l4 4v14H7z" />
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Invoices</span>
                    {invoicesCount > 0 && (
                      <span className="ml-2 rounded-full bg-rose-500/20 text-rose-200 text-[11px] font-semibold px-2 py-0.5">
                        {invoicesCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button 
                onClick={() => navigateTo('payments')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12H3" />
                  <path d="M3 7h18v10H3z" />
                </svg>
                {!sidebarCollapsed && <span>Payments</span>}
              </button>
            </>
          ) : (
            <>
              {!sidebarCollapsed && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Overview
                </div>
              )}
              <button 
                onClick={() => navigateTo('overview')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                {!sidebarCollapsed && <span>Overview</span>}
              </button>

              <button 
                onClick={() => navigateTo('registrations')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {!sidebarCollapsed && <span>Registrations</span>}
              </button>

              {!sidebarCollapsed && (
                <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Catalog
                </div>
              )}

              <button 
                onClick={() => navigateTo('products')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3z"></path>
                  <path d="M7 7h10v10H7z"></path>
                </svg>
                {!sidebarCollapsed && <span>Products</span>}
              </button>

              <button 
                onClick={() => navigateTo('components')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {!sidebarCollapsed && <span>Components</span>}
              </button>
              <button 
                onClick={() => navigateTo('vendor-products')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {!sidebarCollapsed && <span>Vendor Components</span>}
              </button>
              {!sidebarCollapsed && (
                <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Procurement
                </div>
              )}

              <button
                onClick={() => navigateTo('purchase-requests')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13" />
                  <path d="M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
                {!sidebarCollapsed && <span>Purchase Requests</span>}
              </button>

              <button
                onClick={() => navigateTo('purchase-enquiries')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Enquiries</span>
                    {enquiriesCount > 0 && (
                      <span className="ml-2 rounded-full bg-amber-500/20 text-amber-200 text-[11px] font-semibold px-2 py-0.5">
                        {enquiriesCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
              <button
                onClick={() => navigateTo('purchase-quotations')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {!sidebarCollapsed && <span>Quotations</span>}
              </button>
              <button
                onClick={() => navigateTo('purchase-lois')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                  <path d="M12 8V7m0 1v8m0 0v1" />
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>LOIs</span>
                    {loisCount > 0 && (
                      <span className="ml-2 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-semibold px-2 py-0.5">
                        {loisCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
              <button
                onClick={() => navigateTo('purchase-orders')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Orders</span>
                    {ordersCount > 0 && (
                      <span className="ml-2 rounded-full bg-violet-500/20 text-violet-200 text-[11px] font-semibold px-2 py-0.5">
                        {ordersCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
              <button
                onClick={() => navigateTo('vendor-invoices')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 14h6m-6 4h6" />
                  <path d="M7 3h8l4 4v14H7z" />
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Invoices</span>
                    {invoicesCount > 0 && (
                      <span className="ml-2 rounded-full bg-rose-500/20 text-rose-200 text-[11px] font-semibold px-2 py-0.5">
                        {invoicesCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
              <button
                onClick={() => navigateTo('purchase-payments')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12H3" />
                  <path d="M3 7h18v10H3z" />
                </svg>
                {!sidebarCollapsed && <span>Payments</span>}
              </button>

              <button
                onClick={() => navigateTo('payment-receipts')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 14h6m-6 4h6" />
                  <path d="M7 3h8l4 4v14H7z" />
                </svg>
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>Receipts</span>
                    {paymentReceiptCount > 0 && (
                      <span className="ml-2 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-semibold px-2 py-0.5">
                        {paymentReceiptCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
              {!sidebarCollapsed && (
                <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Insights
                </div>
              )}
              <button
                onClick={() => navigateTo('analytics')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M7 15l4-4 4 2 5-6" />
                </svg>
                {!sidebarCollapsed && <span>Analytics</span>}
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 pb-4 border-t border-slate-800 mt-auto space-y-2">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-400 text-sm font-medium rounded-lg hover:bg-red-900 hover:text-red-200 transition-all"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 17l5-5m0 0l-5-5m5 5H9"></path>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? '5rem' : '14rem',
        }}
      >
        {/* Header */}
        <header 
          className={`fixed top-0 ${headerOffsetClass} h-16 bg-gradient-to-r from-slate-900 to-slate-900 border-b border-slate-800 shadow-lg z-30 flex items-center justify-between px-6 transition-all duration-300`}
          style={{
            width: sidebarCollapsed ? 'calc(100% - 5rem)' : 'calc(100% - 14rem)',
          }}
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-slate-100 truncate">{currentPage}</h1>
            {pageDescription && <p className="text-xs text-slate-300 truncate">{pageDescription}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-slate-800/60 px-3 py-2 hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold">
                {initials}
              </span>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-100 leading-tight">
                  {profile.name || userName}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wide">
                  {profile.role || (userType === 'vendor' ? 'Vendor' : 'Purchase Manager')}
                </span>
              </div>
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.25 8.29a.75.75 0 0 1-.02-1.08z" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-sm font-bold">
                      {initials || 'U'}
                    </span>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">{profile.role || (userType === 'vendor' ? 'Vendor' : 'Purchase Manager')}</p>
                      <p className="text-base font-bold text-slate-900">{profile.name || userName}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Email</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{profile.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Company</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{profile.company || '—'}</p>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-500 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-slate-100 text-slate-900 pt-20 px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
