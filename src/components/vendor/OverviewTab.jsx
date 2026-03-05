/**
 * OverviewTab - Vendor dashboard overview with profile info and quick stats
 * Displays vendor account details, quick actions, and key quick statistics
 *
 * Props:
 * - components: Array of vendor components
 * - purchaseEnquiries: Array of enquiries
 * - purchaseOrders: Array of orders
 * - vendorInvoices: Array of invoices
 * - vendor: Vendor profile object
 * - isEditingAccount: Boolean for account edit mode
 * - accountFormData: Form data for account edit
 * - onAccountInputChange: Handler for form input changes
 * - onUpdateAccount: Handler to save account updates
 * - onCancelEditAccount: Handler to cancel account edit
 * - onStartEditAccount: Handler to start account edit
 * - onGoToComponents: Navigation handler to components tab
 */
function OverviewTab({
  components = [],
  purchaseEnquiries = [],
  purchaseOrders = [],
  vendorInvoices = [],
  vendor = null,
  isEditingAccount = false,
  accountFormData = {},
  onAccountInputChange = () => {},
  onUpdateAccount = () => {},
  onCancelEditAccount = () => {},
  onStartEditAccount = () => {},
  onGoToComponents = () => {},
}) {
  // Quick stats - calculated from data
  const quickStats = [
    {
      label: 'Active Components',
      value: components.filter((c) => c.status === 'approved').length,
      color: 'emerald',
      icon: '📦',
    },
    {
      label: 'Pending Orders',
      value: purchaseOrders.filter((o) => o.status !== 'completed').length,
      color: 'amber',
      icon: '📋',
    },
    {
      label: 'Open Enquiries',
      value: purchaseEnquiries.filter((e) => e.status === 'pending').length,
      color: 'blue',
      icon: '💬',
    },
    {
      label: 'Pending Invoices',
      value: vendorInvoices.filter((i) => i.status !== 'paid').length,
      color: 'rose',
      icon: '📄',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {vendor?.company_name || 'Vendor'}! 👋
        </h1>
        <p className="text-slate-600">Manage your products, quotations, and orders in one place.</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className={`
              bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-50
              border border-${stat.color}-200 rounded-2xl p-5
              hover:shadow-md transition-all
            `}
            style={{
              background: stat.color === 'emerald' ? 'linear-gradient(to bottom right, #f0fdf4, #ecfdf5)' :
                          stat.color === 'amber' ? 'linear-gradient(to bottom right, #fffbeb, #fef3c7)' :
                          stat.color === 'blue' ? 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)' :
                          'linear-gradient(to bottom right, #fff7ed, #fee2e2)',
              borderColor: stat.color === 'emerald' ? '#86efac' :
                          stat.color === 'amber' ? '#fcd34d' :
                          stat.color === 'blue' ? '#bfdbfe' :
                          '#fca5a5',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Profile Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Company Profile</h3>
            {!isEditingAccount && (
              <button
                onClick={onStartEditAccount}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                ✎ Edit
              </button>
            )}
          </div>

          {!isEditingAccount ? (
            // Display Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Company Name</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{vendor?.company_name || 'Not added'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">TIN/GST</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{vendor?.company_tin || 'Not added'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{vendor?.address || 'Not added'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Contact Person</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{vendor?.contact_person || 'Not added'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{vendor?.contact_phone || 'Not added'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{vendor?.contact_email || 'Not added'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Website</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {vendor?.company_website ? (
                      <a href={vendor.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {vendor.company_website}
                      </a>
                    ) : (
                      'Not added'
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onUpdateAccount(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={accountFormData.company_name || ''}
                    onChange={onAccountInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">TIN/GST</label>
                  <input
                    type="text"
                    name="company_tin"
                    value={accountFormData.company_tin || ''}
                    onChange={onAccountInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Address</label>
                <textarea
                  name="address"
                  value={accountFormData.address || ''}
                  onChange={onAccountInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Contact Person</label>
                  <input
                    type="text"
                    name="contact_person"
                    value={accountFormData.contact_person || ''}
                    onChange={onAccountInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={accountFormData.contact_phone || ''}
                    onChange={onAccountInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Email *</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={accountFormData.contact_email || ''}
                    onChange={onAccountInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Website</label>
                  <input
                    type="url"
                    name="company_website"
                    value={accountFormData.company_website || ''}
                    onChange={onAccountInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  ✓ Save Changes
                </button>
                <button
                  type="button"
                  onClick={onCancelEditAccount}
                  className="px-6 py-2 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition"
                >
                  ✕ Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={onGoToComponents}
              className="w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
            >
              <p className="font-semibold text-indigo-900">📦 Manage Components</p>
              <p className="text-xs text-indigo-700 mt-1">Add, edit, or delete products</p>
            </button>

            <button
              onClick={() => alert('Navigate to quotations')}
              className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
            >
              <p className="font-semibold text-purple-900">💬 View Quotations</p>
              <p className="text-xs text-purple-700 mt-1">Respond to enquiries</p>
            </button>

            <button
              onClick={() => alert('Navigate to orders')}
              className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
            >
              <p className="font-semibold text-blue-900">📋 View Orders</p>
              <p className="text-xs text-blue-700 mt-1">Track pending orders</p>
            </button>

            <button
              onClick={() => alert('Navigate to invoices')}
              className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition"
            >
              <p className="font-semibold text-green-900">📄 View Invoices</p>
              <p className="text-xs text-green-700 mt-1">Payment tracking</p>
            </button>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">💡 Tips to grow your business</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ Keep your component catalog up-to-date with latest specifications</li>
          <li>✓ Respond to enquiries within 24 hours for better conversion rates</li>
          <li>✓ Monitor pending invoices and ensure timely payment tracking</li>
          <li>✓ Check analytics dashboard to review your performance metrics</li>
        </ul>
      </div>
    </div>
  );
}

export default OverviewTab;
