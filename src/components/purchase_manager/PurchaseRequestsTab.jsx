import { useState } from 'react';

// Purchase requests from planning manager
function PurchaseRequestsTab({ requests, onRaiseEnquiry }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestSearch, setRequestSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const getStatusColor = (status) => {
    if (status === 'pending') return 'bg-blue-100 text-blue-700';
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  const filteredRequests = requests.filter((req) => {
    const title = (req.request_type || '').toLowerCase();
    const description = (req.description || '').toLowerCase();
    const matchesSearch = title.includes(requestSearch.toLowerCase()) || description.includes(requestSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (req.status || 'pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Planning Requests</h2>
        <p className="text-sm text-slate-500">Review incoming requests from planning.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search requests by type or description..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Requests</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredRequests.length}</span>
        </div>
        {filteredRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No planning requests yet.</p>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.requestid || req.id}
                className="rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
              >
                <div
                  onClick={() => setSelectedRequest(req)}
                  className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{req.request_type || 'Request'}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{req.description || '—'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status || 'pending')}`}>
                      {req.status || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRaiseEnquiry(req);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
                  >
                    Raise Enquiry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Request Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedRequest.request_type || 'Request'}</h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status || 'pending')}`}>
                  {selectedRequest.status || 'pending'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                  {selectedRequest.description || '—'}
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseRequestsTab;
