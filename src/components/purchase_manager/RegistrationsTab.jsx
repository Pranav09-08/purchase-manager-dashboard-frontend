// Vendor registration review table
function RegistrationsTab({
  filter = '',
  loading = false,
  registrations = [],
  onFilterChange = () => {},
  onView = () => {},
  onApprove = () => {},
  onReject = () => {},
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: '', label: 'All' },
        ].map((btn) => (
          <button
            key={btn.label}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filter === btn.key
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-600 hover:text-blue-600'
            }`}
            onClick={() => onFilterChange(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
          Loading registrations...
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
          No registrations found
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.vendor_id || registration.vendor_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">{registration.company_name}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{registration.contact_person || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{registration.contact_email}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{registration.contact_phone || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        registration.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : registration.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                        onClick={() => onView(registration)}
                      >
                        View
                      </button>
                      {registration.status === 'pending' && (
                        <>
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                            onClick={() => onApprove(registration.vendor_id || registration.vendor_id)}
                          >
                            Approve
                          </button>
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                            onClick={() => onReject(registration)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RegistrationsTab;
