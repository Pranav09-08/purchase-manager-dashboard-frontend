import { useState } from 'react';

// Vendor orders list and confirmation
function OrdersTab({ 
  orders = [], 
  onConfirm = () => {}, 
  onGoToInvoices = () => {}, 
  focusLoiId, 
  onClearFocus, 
  onViewInvoice = () => {}, 
  onEditInvoice = () => {} 
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const getNextStep = (status) => {
    if (status === 'pending') return 'Review and confirm order acceptance.';
    if (status === 'confirmed') return 'Generate and submit invoice for payment.';
    if (status === 'completed') return 'Order completed and closed.';
    if (status === 'cancelled') return 'Order cancelled. No action required.';
    return 'Order processing in progress.';
  };
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const getStatusColor = (status) => {
    if (status === 'pending') return 'bg-blue-100 text-blue-700';
    if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'completed') return 'bg-indigo-100 text-indigo-700';
    if (status === 'cancelled') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  const resolveLoiId = (order) => order.loi_id || order.loiId;
  const focusId = focusLoiId ? String(focusLoiId) : '';
  const focusOrders = focusId
    ? orders.filter((order) => String(resolveLoiId(order)) === focusId)
    : orders;
  const filteredOrders = focusOrders.filter((order) => {
    const number = (order.order_number || '').toLowerCase();
    const matchesSearch = number.includes(orderSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Purchase Orders</h2>
        <p className="text-sm text-slate-500">Confirm orders from the PM. After confirmation, generate and submit invoices for payment.</p>
      </div>

      {focusId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Showing orders for LOI <span className="font-semibold">{focusId}</span>.
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
              placeholder="Search orders by number..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
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
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Orders</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredOrders.length}</span>
        </div>
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <button
                type="button"
                key={order.order_id}
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{order.order_number}</p>
                    <p className="text-xs text-slate-500">Expected: {formatDate(order.expected_delivery_date)}</p>
                    <p className="text-xs text-slate-500 mt-1">{getNextStep(order.status)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status || 'new'}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
                {order.status === 'pending' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirm(order.order_id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Order Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedOrder.order_number}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
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
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Delivery</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedOrder.expected_delivery_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Next Step</label>
                  <p className="text-sm text-slate-900">{getNextStep(selectedOrder.status)}</p>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {selectedOrder.invoice && selectedOrder.invoice.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      if (onViewInvoice) {
                        onViewInvoice(selectedOrder.invoice[0], selectedOrder);
                      }
                      setSelectedOrder(null);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                  >
                    📄 View Invoice
                  </button>
                  <button
                    onClick={() => {
                      if (onEditInvoice) {
                        onEditInvoice(selectedOrder.invoice[0], selectedOrder);
                      }
                      setSelectedOrder(null);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    ✏️ Edit Invoice
                  </button>
                </>
              ) : (
                onGoToInvoices && (
                  <button
                    onClick={() => {
                      onGoToInvoices(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                  >
                    Create Invoice
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersTab;
