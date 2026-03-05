import { useState } from 'react';

// Vendor payment status list
function PaymentsTab({ 
  payments = [], 
  orders = [], 
  invoices = [], 
  onConfirmReceived = () => {}, 
  onGoToInvoices = () => {}, 
  focusOrderId, 
  onClearFocus 
}) {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [receiptMessage, setReceiptMessage] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  const orderLookup = orders.reduce((acc, order) => {
    acc[order.order_id] = order.order_number || 'Order';
    return acc;
  }, {});
  const orderTotals = orders.reduce((acc, order) => {
    acc[String(order.order_id)] = {
      totalAmount: Number(order.total_amount || 0),
      advancePercent: Number(order.advance_payment_percent || 0),
      advanceAmount: Number(order.advance_amount || 0),
    };
    return acc;
  }, {});
  const paymentTotals = payments.reduce((acc, payment) => {
    if (payment.status === 'failed') return acc;
    const key = String(payment.order_id);
    acc[key] = acc[key] || { total: 0, advance: 0, installment: 0, final: 0 };
    const amount = Number(payment.amount || 0);
    acc[key].total += amount;
    if (payment.phase === 'advance') acc[key].advance += amount;
    if (payment.phase === 'installment') acc[key].installment += amount;
    if (payment.phase === 'final') acc[key].final += amount;
    return acc;
  }, {});
  const invoicedOrders = invoices.reduce((acc, invoice) => {
    acc[String(invoice.order_id)] = true;
    return acc;
  }, {});
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const getReceiptReference = (payment) => (payment.notes || '').trim();
  const isUrl = (value) => /^https?:\/\//i.test(value);
  const getNextStep = (status) => {
    if (status === 'pending') return 'Waiting for payment completion.';
    if (status === 'completed') return 'Send payment receipt.';
    if (status === 'receipt_sent') return 'Receipt sent. Payment acknowledged.';
    if (status === 'failed') return 'Await new payment.';
    return 'Payment in progress.';
  };
  const getStatusColor = (status) => {
    if (status === 'pending') return 'bg-blue-100 text-blue-700';
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'receipt_sent') return 'bg-indigo-100 text-indigo-700';
    if (status === 'failed') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  const focusId = focusOrderId ? String(focusOrderId) : '';
  const focusPayments = focusId
    ? payments.filter((payment) => String(payment.order_id) === focusId)
    : payments;
  const filteredPayments = focusPayments.filter((payment) => {
    const orderNumber = (orderLookup[payment.order_id] || '').toLowerCase();
    const phase = (payment.phase || '').toLowerCase();
    const matchesSearch = orderNumber.includes(paymentSearch.toLowerCase()) || phase.includes(paymentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Payments</h2>
        <p className="text-sm text-slate-500">Track payment status and send receipts.</p>
      </div>

      {focusId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Showing payments for order <span className="font-semibold">{focusId}</span>.
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
              placeholder="Search payments by order or phase..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
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
            <option value="completed">Completed</option>
            <option value="receipt_sent">Receipt Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Payment Timeline</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredPayments.length}</span>
        </div>
        {filteredPayments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <button
                type="button"
                key={payment.payment_id}
                onClick={() => setSelectedPayment(payment)}
                className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {orderLookup[payment.order_id] || 'Order'} · {payment.phase || 'Phase'}
                    </p>
                    <p className="text-xs text-slate-500">Due: {formatDate(payment.due_date)}</p>
                    <p className="text-xs text-slate-500 mt-1">{getNextStep(payment.status)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                      {payment.status || 'new'}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
                {payment.status === 'completed' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPaymentForReceipt(payment);
                        setReceiptMessage('');
                        setShowReceiptModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                    >
                      Confirm & Send Receipt
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Payment Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{orderLookup[selectedPayment.order_id] || 'Order'}</h2>
                <p className="text-xs text-slate-500 mt-1">Phase: {selectedPayment.phase || '—'}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {(() => {
                const orderId = String(selectedPayment.order_id);
                const totals = orderTotals[orderId] || { totalAmount: 0, advancePercent: 0, advanceAmount: 0 };
                const paid = paymentTotals[orderId]?.total || 0;
                const advancePaid = paymentTotals[orderId]?.advance || 0;
                const baseTotal = totals.totalAmount || 0;
                const advanceExpected = totals.advanceAmount || (baseTotal * (totals.advancePercent || 0) / 100);
                const remaining = Math.max(0, baseTotal - paid);
                return (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Total Amount</label>
                      <p className="text-sm text-slate-900">{formatCurrency(baseTotal)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Paid Till Date</label>
                      <p className="text-sm text-slate-900">{formatCurrency(paid)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Pending Amount</label>
                      <p className="text-sm text-slate-900">{formatCurrency(remaining)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Advance Expected</label>
                      <p className="text-sm text-slate-900">{formatCurrency(advanceExpected)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Advance Paid</label>
                      <p className="text-sm text-slate-900">{formatCurrency(advancePaid)}</p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedPayment.due_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Paid Date</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedPayment.payment_date)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reference</label>
                  <p className="text-sm text-slate-900">{selectedPayment.reference_number || '—'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Receipt</label>
                  <p className="text-sm text-slate-900">
                    {getReceiptReference(selectedPayment) ? (
                      isUrl(getReceiptReference(selectedPayment)) ? (
                        <a
                          href={getReceiptReference(selectedPayment)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-semibold underline"
                        >
                          View Receipt
                        </a>
                      ) : (
                        getReceiptReference(selectedPayment)
                      )
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Next Step</label>
                <p className="text-sm text-slate-900">{getNextStep(selectedPayment.status)}</p>
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {onGoToInvoices && !invoicedOrders[String(selectedPayment.order_id)] && (
                <button
                  onClick={() => {
                    onGoToInvoices(selectedPayment.order_id);
                    setSelectedPayment(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  Create Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Send Payment Receipt</p>
                <h2 className="text-lg font-semibold text-slate-900">{orderLookup[selectedPaymentForReceipt.order_id] || 'Order'}</h2>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedPaymentForReceipt(null);
                  setReceiptMessage('');
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-600 mb-1">Amount</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedPaymentForReceipt.amount)}</p>
                <p className="text-xs text-slate-600 mt-2">Phase: <span className="font-semibold">{selectedPaymentForReceipt.phase}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Receipt Message / Reference (Optional)
                </label>
                <textarea
                  value={receiptMessage}
                  onChange={(e) => setReceiptMessage(e.target.value)}
                  placeholder="E.g., Payment received via bank transfer ref: ABC123 or link to receipt image/PDF"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  rows="4"
                />
                <p className="text-xs text-slate-500 mt-2">
                  You can include a reference number, bank details, or link to the receipt document.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedPaymentForReceipt(null);
                  setReceiptMessage('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirmReceived(selectedPaymentForReceipt.payment_id, receiptMessage);
                  setShowReceiptModal(false);
                  setSelectedPaymentForReceipt(null);
                  setReceiptMessage('');
                  setSelectedPayment(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
              >
                Send Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentsTab;
