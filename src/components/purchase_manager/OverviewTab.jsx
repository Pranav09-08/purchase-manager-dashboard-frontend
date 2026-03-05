// Overview dashboard cards and recent registrations
function OverviewTab({ 
  overviewStats = {
    totalVendors: 0,
    approvedVendors: 0,
    pendingVendors: 0,
    rejectedVendors: 0,
    totalVendorComponents: 0,
    recentRegistrations: [],
  }, 
  onGoToRegistrations = () => {}, 
  onGoToVendorComponents = () => {} 
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-500">Snapshot of vendor activity and registrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Vendors</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{overviewStats.totalVendors}</p>
          <p className="text-xs text-slate-500 mt-2">All registered vendors</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Approved</p>
          <p className="text-3xl font-bold text-emerald-700 mt-2">{overviewStats.approvedVendors}</p>
          <p className="text-xs text-emerald-600 mt-2">
            {overviewStats.totalVendors > 0
              ? Math.round((overviewStats.approvedVendors / overviewStats.totalVendors) * 100)
              : 0}% of total
          </p>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 uppercase">Pending</p>
          <p className="text-3xl font-bold text-amber-700 mt-2">{overviewStats.pendingVendors}</p>
          <p className="text-xs text-amber-600 mt-2">Awaiting approval</p>
        </div>
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-rose-600 uppercase">Rejected</p>
          <p className="text-3xl font-bold text-rose-700 mt-2">{overviewStats.rejectedVendors}</p>
          <p className="text-xs text-rose-600 mt-2">Rejected registrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Vendor Components</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{overviewStats.totalVendorComponents}</p>
          <button
            onClick={onGoToVendorComponents}
            className="w-full mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            View Components
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-4">Quick Actions</p>
          <button
            onClick={onGoToRegistrations}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Review Registrations
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Vendor Registrations</h3>
            <p className="text-sm text-slate-500 mt-1">Latest applications from vendors</p>
          </div>
          <button
            onClick={onGoToRegistrations}
            className="px-4 py-2 text-slate-700 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
          >
            View All →
          </button>
        </div>

        {overviewStats.recentRegistrations.length === 0 ? (
          <p className="text-sm text-slate-500">No recent registrations</p>
        ) : (
          <div className="space-y-3">
            {overviewStats.recentRegistrations.map((reg, index) => (
              <div key={reg.vendor_id || reg.contact_email || index} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{reg.company_name}</p>
                    <p className="text-xs text-slate-500">{reg.contact_email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reg.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : reg.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onGoToRegistrations(reg)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OverviewTab;
