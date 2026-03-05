import { useState } from 'react';

// Vendor LOIs list with accept/reject actions
function LoisTab({ 
  lois = [], 
  orders = [], 
  invoices = [], 
  onAccept = () => {}, 
  onReject = () => {}, 
  onGoToOrders = () => {}, 
  onGoToInvoices = () => {}, 
  focusQuotationId, 
  onClearFocus = () => {} 
}) {
  const [selectedLoi, setSelectedLoi] = useState(null);
  const [loiSearch, setLoiSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const getNextStep = (status) => {
    if (status === 'sent') return 'Review and accept or reject the LOI.';
    if (status === 'accepted') return 'Waiting for PM to generate purchase order.';
    if (status === 'rejected') return 'LOI rejected. No further action required.';
    if (status === 'confirmed') return 'Purchase order generated. Submit invoice.';
    return 'LOI status in progress.';
  };
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const getStatusColor = (status) => {
    if (status === 'sent') return 'bg-blue-100 text-blue-700';
    if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    if (status === 'confirmed') return 'bg-indigo-100 text-indigo-700';
    return 'bg-slate-100 text-slate-700';
  };

  // Check if order already exists for LOI
  const hasOrder = (loiId) => {
    return orders.some((order) => {
      const orderLoiId = order.loi_id || order.loiId;
      return String(orderLoiId) === String(loiId);
    });
  };
  const hasInvoiceForLoi = (loiId) => {
    const order = orders.find((entry) => String(entry.loi_id || entry.loiId) === String(loiId));
    if (!order) return false;
    return invoices.some((invoice) => String(invoice.order_id) === String(order.order_id));
  };
  const resolveQuotationId = (loi) => loi.quotation_id || loi.quotationId;
  const focusId = focusQuotationId ? String(focusQuotationId) : '';
  const focusLois = focusId
    ? lois.filter((loi) => String(resolveQuotationId(loi)) === focusId)
    : lois;
  const filteredLois = focusLois.filter((loi) => {
    const number = (loi.loi_number || '').toLowerCase();
    const matchesSearch = number.includes(loiSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const sortedLois = [...filteredLois].sort((a, b) => {
    const aDate = new Date(a.loi_date || a.created_at || 0).getTime();
    const bDate = new Date(b.loi_date || b.created_at || 0).getTime();
    return sortOrder === 'date_asc' ? aDate - bDate : bDate - aDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Letters of Intent</h2>
        <p className="text-sm text-slate-500">Review and respond to LOIs from the purchase manager. After acceptance, the PM will generate a purchase order.</p>
      </div>

      {focusId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Showing LOIs for quotation <span className="font-semibold">{focusId}</span>.
          </p>
          {onClearFocus && (
            <button
              type="button"
              onClick={onClearFocus}
              className="text-xs font-semibold uppercase text-amber-800 hover:text-amber-900"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search LOIs by number..."
              value={loiSearch}
              onChange={(e) => setLoiSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="confirmed">Confirmed</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">LOIs</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredLois.length}</span>
        </div>
        {sortedLois.length === 0 ? (
          <p className="text-sm text-slate-500">No LOIs yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedLois.map((loi) => (
              <button
                type="button"
                key={loi.loi_id}
                onClick={() => setSelectedLoi(loi)}
                className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{loi.loi_number}</p>
                    <p className="text-xs text-slate-500">Expected: {formatDate(loi.expected_delivery_date)}</p>
                    <p className="text-xs text-slate-500 mt-1">{getNextStep(loi.status)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loi.status)}`}>
                      {loi.status || 'new'}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(loi.total_amount)}</span>
                  </div>
                </div>
                {loi.status === 'sent' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccept(loi.loi_id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(loi.loi_id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLoi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">LOI Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedLoi.loi_number}</h2>
              </div>
              <button
                onClick={() => setSelectedLoi(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedLoi.status)}`}>
                    {selectedLoi.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedLoi.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Delivery</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedLoi.expected_delivery_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Next Step</label>
                  <p className="text-sm text-slate-900">{getNextStep(selectedLoi.status)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Terms</label>
                <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                  {selectedLoi.terms_and_conditions || '—'}
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedLoi(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {onGoToOrders && (
                <button
                  onClick={() => {
                    onGoToOrders(selectedLoi);
                    setSelectedLoi(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  {hasOrder(selectedLoi.loi_id) ? 'View Order' : 'View Orders'}
                </button>
              )}
              {onGoToInvoices && hasOrder(selectedLoi.loi_id) && !hasInvoiceForLoi(selectedLoi.loi_id) && (
                <button
                  onClick={() => {
                    const order = orders.find((entry) => String(entry.loi_id || entry.loiId) === String(selectedLoi.loi_id));
                    if (order) {
                      onGoToInvoices(order);
                    }
                    setSelectedLoi(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                >
                  Generate Invoice
                </button>
              )}
              {hasOrder(selectedLoi.loi_id) && (
                <span className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                  Order Generated ✓
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoisTab;
