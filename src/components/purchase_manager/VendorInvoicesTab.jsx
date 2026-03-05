import { useState } from 'react';

// Vendor invoices list and status actions
function VendorInvoicesTab({ invoices, payments = [], lois = [], vendorLookup = {}, componentLookup = {}, orderLookup = {}, onMarkReceived, onAccept, onReject, onRejectInvoice, onMarkPaid, onGoToPayments, focusOrderId, onClearFocus }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceForPayments, setSelectedInvoiceForPayments] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const rejectHandler = onRejectInvoice || onReject;
  const getNextStep = (status, pending = null) => {
    // If pending is provided and = 0, show closed status
    if (pending !== null && pending <= 0.01) {
      return 'Invoice settled and closed.';
    }
    if (status === 'pending') return 'Review invoice and mark received.';
    if (status === 'received') return 'Accept or reject the invoice.';
    if (status === 'accepted') return 'Make payment to settle invoice.';
    if (status === 'paid') return 'Invoice settled and closed.';
    if (status === 'rejected') return 'Await revised invoice.';
    return 'Invoice in progress.';
  };
  const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const getStatusColor = (status, pending = null) => {
    // If pending = 0, show as indigo (closed/settled)
    if (pending !== null && pending <= 0.01) return 'bg-indigo-100 text-indigo-700';
    if (status === 'pending' || status === 'received') return 'bg-blue-100 text-blue-700';
    if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'paid') return 'bg-indigo-100 text-indigo-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  
  const getDisplayStatus = (status, pending = null) => {
    if (pending !== null && pending <= 0.01) return 'closed';
    return status;
  };
  const focusId = focusOrderId ? String(focusOrderId) : '';
  const paymentTotals = payments.reduce((acc, payment) => {
    if (payment.status === 'failed') return acc;
    const key = String(payment.order_id);
    const amount = parseFloat(payment.amount || 0);
    acc[key] = (acc[key] || 0) + amount;
    return acc;
  }, {});
  const focusInvoices = focusId
    ? invoices.filter((invoice) => String(invoice.order_id) === focusId)
    : invoices;
  const filteredInvoices = focusInvoices.filter((invoice) => {
    const number = (invoice.invoice_number || '').toLowerCase();
    const vendor = (vendorLookup[invoice.vendor_id] || '').toLowerCase();
    const order = (orderLookup[invoice.order_id] || '').toLowerCase();
    const matchesSearch = number.includes(invoiceSearch.toLowerCase()) || vendor.includes(invoiceSearch.toLowerCase()) || order.includes(invoiceSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Vendor Invoices</h2>
        <p className="text-sm text-slate-500">Review invoices and manage approvals.</p>
      </div>

      {focusId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Showing invoices for order <span className="font-semibold">{focusId}</span>.
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
              placeholder="Search invoices by number, vendor, or order..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
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
            <option value="received">Received</option>
            <option value="accepted">Accepted</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Invoice Queue</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredInvoices.length}</span>
        </div>
        {filteredInvoices.length === 0 ? (
          <p className="text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <button
                type="button"
                key={invoice.invoice_id}
                onClick={() => setSelectedInvoice(invoice)}
                className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
              >
                {(() => {
                  const totalPaid = paymentTotals[String(invoice.order_id)] || 0;
                  const totalAmount = Number(invoice.total_amount || 0);
                  const isFullyPaid = totalPaid + 0.01 >= totalAmount;
                  return (
                    <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{invoice.invoice_number}</p>
                    <p className="text-xs text-slate-500">Vendor: {vendorLookup[invoice.vendor_id] || 'Vendor'}</p>
                    <p className="text-xs text-slate-500">Order: {orderLookup[invoice.order_id] || 'Order'}</p>
                    <p className="text-xs text-slate-500 mt-1">{getNextStep(invoice.status, totalAmount - totalPaid)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status, totalAmount - totalPaid)}`}>
                      {getDisplayStatus(invoice.status, totalAmount - totalPaid)}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {invoice.status === 'pending' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkReceived(invoice.invoice_id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                    >
                      Mark Received
                    </button>
                  )}
                  {invoice.status === 'received' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAccept(invoice.invoice_id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectHandler?.(invoice.invoice_id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {invoice.status === 'accepted' && isFullyPaid && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkPaid(invoice.invoice_id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
                    </>
                  );
                })()}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Invoice Details</p>
                <h4 className="text-lg font-bold text-slate-900">{selectedInvoice.invoice_number}</h4>
                <p className="text-xs text-slate-500 mt-1">Order: {orderLookup[selectedInvoice.order_id] || 'Order'}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const totalPaid = paymentTotals[String(selectedInvoice.order_id)] || 0;
                const totalAmount = Number(selectedInvoice.total_amount || 0);
                const pending = Math.max(0, totalAmount - totalPaid);
                
                // Use invoice's advance payment percent (if available, otherwise 50%)
                const advancePercent = Number(selectedInvoice?.advance_payment_percent) || 50;
                const advanceAmount = (totalAmount * advancePercent) / 100;
                
                // Calculate paid by phase
                const advancePayments = Object.values(payments || []).filter(p => 
                  String(p.order_id) === String(selectedInvoice.order_id) && 
                  p.phase === 'advance' && 
                  p.status !== 'failed'
                ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
                const installmentPayments = Object.values(payments || []).filter(p => 
                  String(p.order_id) === String(selectedInvoice.order_id) && 
                  p.phase === 'installment' && 
                  p.status !== 'failed'
                ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
                const finalPayments = Object.values(payments || []).filter(p => 
                  String(p.order_id) === String(selectedInvoice.order_id) && 
                  p.phase === 'final' && 
                  p.status !== 'failed'
                ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
                const installmentCount = Object.values(payments || []).filter(p => 
                  String(p.order_id) === String(selectedInvoice.order_id) && 
                  p.phase === 'installment' && 
                  p.status !== 'failed'
                ).length;
                
                return (
                  <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500">Total Amount</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500">Total Paid</p>
                      <p className="font-semibold text-emerald-700">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500">Remaining</p>
                      <p className={`font-semibold ${pending <= 0.01 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(pending)}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500">Invoice Status</p>
                      <p className={`font-semibold ${pending <= 0.01 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {pending <= 0.01 ? '✓ Closed' : 'Open'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Payment Breakdown (3-Phase System)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className={`${advancePayments >= advanceAmount - 0.01 ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'} border rounded-lg px-3 py-2`}>
                        <p className={`text-xs font-semibold ${advancePayments >= advanceAmount - 0.01 ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {advancePayments >= advanceAmount - 0.01 ? '✓ ' : ''}Advance Payment ({advancePercent}%)
                        </p>
                        <p className={`font-bold ${advancePayments >= advanceAmount - 0.01 ? 'text-emerald-900' : 'text-blue-900'}`}>{formatCurrency(advanceAmount)}</p>
                        <p className={`text-xs mt-1 ${advancePayments >= advanceAmount - 0.01 ? 'text-emerald-700' : 'text-blue-700'}`}>
                          Paid: {formatCurrency(advancePayments)}
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-purple-600 font-semibold">Installment Payments</p>
                        <p className="font-bold text-purple-900">{formatCurrency(installmentPayments)}</p>
                        <p className="text-xs text-purple-700 mt-1">{installmentCount} payment(s) made</p>
                      </div>
                      <div className={`${finalPayments > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} border rounded-lg px-3 py-2`}>
                        <p className={`text-xs font-semibold ${finalPayments > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {finalPayments > 0 ? '✓ ' : ''}Final Payment
                        </p>
                        <p className={`font-bold ${finalPayments > 0 ? 'text-emerald-900' : 'text-amber-900'}`}>{formatCurrency(finalPayments)}</p>
                        <p className={`text-xs mt-1 ${finalPayments > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {finalPayments > 0 ? 'Invoice Closed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                  </>
                );
              })()}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`inline-flex px-3 py-1 mt-1 rounded-full text-xs font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status || 'new'}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Invoice Date</p>
                  <p className="font-semibold text-slate-900">{formatDate(selectedInvoice.invoice_date)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.total_amount)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Subtotal</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.subtotal)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full min-w-[720px] text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-2 text-left font-semibold">Component</th>
                      <th className="py-2 text-right font-semibold">Qty</th>
                      <th className="py-2 text-right font-semibold">Unit</th>
                      <th className="py-2 text-right font-semibold">Disc %</th>
                      <th className="py-2 text-right font-semibold">CGST %</th>
                      <th className="py-2 text-right font-semibold">SGST %</th>
                      <th className="py-2 text-right font-semibold">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.items || []).length === 0 ? (
                      <tr>
                        <td className="py-3 text-slate-500" colSpan={7}>No line items.</td>
                      </tr>
                    ) : (
                      (selectedInvoice.items || []).map((item) => (
                        <tr key={item.item_id} className="border-b border-slate-100">
                          <td className="py-2 text-slate-700">
                            {componentLookup[item.component_id] || 'Component'}
                          </td>
                          <td className="py-2 text-right text-slate-700">{item.quantity}</td>
                          <td className="py-2 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 text-right text-slate-700">{item.discount_percent || 0}%</td>
                          <td className="py-2 text-right text-slate-700">{item.cgst_percent || 0}%</td>
                          <td className="py-2 text-right text-slate-700">{item.sgst_percent || 0}%</td>
                          <td className="py-2 text-right font-semibold text-slate-900">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Total Discount</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.total_discount)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Total CGST</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.total_cgst)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Total SGST</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.total_sgst)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">Payable</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(selectedInvoice.total_amount)}</p>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="text-sm text-slate-600">Notes: {selectedInvoice.notes}</div>
              )}
              {(() => {
                const totalPaid = paymentTotals[String(selectedInvoice.order_id)] || 0;
                const totalAmount = Number(selectedInvoice.total_amount || 0);
                const pending = Math.max(0, totalAmount - totalPaid);
                return (
                  <div className="text-sm text-slate-600">Next: {pending <= 0.01 ? 'Invoice settled and closed.' : getNextStep(selectedInvoice.status)}</div>
                );
              })()}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {(() => {
                const totalPaid = paymentTotals[String(selectedInvoice.order_id)] || 0;
                const totalAmount = Number(selectedInvoice.total_amount || 0);
                const pending = Math.max(0, totalAmount - totalPaid);

                if (pending <= 0.01) {
                  return (
                    <button
                      onClick={() => setSelectedInvoiceForPayments(selectedInvoice.invoice_id)}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                    >
                      View Payments Done
                    </button>
                  );
                }

                return (
                  onGoToPayments && (
                    <button
                      onClick={() => {
                        onGoToPayments(selectedInvoice.order_id);
                        setSelectedInvoice(null);
                      }}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                    >
                      Create Payment
                    </button>
                  )
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedInvoiceForPayments && (() => {
        const invoice = invoices.find((inv) => String(inv.invoice_id) === String(selectedInvoiceForPayments));
        if (!invoice) return null;

        const orderId = invoice.order_id;
        const invoicePayments = payments.filter((p) => String(p.order_id) === String(orderId) && p.status !== 'failed');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Payments Received</p>
                  <h2 className="text-xl font-semibold text-slate-900">Invoice {invoice.invoice_number || invoice.invoice_id}</h2>
                </div>
                <button
                  onClick={() => setSelectedInvoiceForPayments(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {invoicePayments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments received for this invoice.</p>
                ) : (
                  <div className="space-y-3">
                    {invoicePayments.map((payment) => (
                      <div key={payment.payment_id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-slate-600 mt-1">Phase: {payment.phase || '—'}</p>
                            <p className="text-xs text-slate-600">Mode: {payment.payment_mode || '—'}</p>
                            <p className="text-xs text-slate-600">Paid: {formatDate(payment.payment_date)}</p>
                            {payment.reference_number && (
                              <p className="text-xs text-slate-600">Ref: {payment.reference_number}</p>
                            )}
                          </div>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                            {payment.status || 'new'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                <button
                  onClick={() => setSelectedInvoiceForPayments(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default VendorInvoicesTab;
