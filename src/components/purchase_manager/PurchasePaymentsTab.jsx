import { useEffect, useState } from 'react';

// Purchase payments list and create form
function PurchasePaymentsTab({ 
  payments, 
  orders = [], 
  invoices = [], 
  formData = {}, 
  paymentFormData = {},
  onInputChange, 
  onPaymentInputChange,
  onSubmit, 
  onPaymentSubmit,
  onComplete, 
  onFail, 
  onGoToInvoices, 
  focusOrderId, 
  prefillOrderId, 
  onClearFocus 
}) {
  // Use payment-specific props if available, otherwise fall back to generic ones
  const activeFormData = paymentFormData && Object.keys(paymentFormData).length > 0 ? paymentFormData : formData;
  const activeInputChange = onPaymentInputChange || onInputChange;
  const activeSubmit = onPaymentSubmit || onSubmit;
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedOrderForPayments, setSelectedOrderForPayments] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderBalances, setOrderBalances] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  // Reset error flags when form is cleared (after successful submission)
  // Check if form is in cleared/initial state by checking multiple fields
  useEffect(() => {
    // If all key fields are empty, form was just cleared - reset errors
    const isCleared = !activeFormData.orderId && !activeFormData.phase && !activeFormData.amount;
    if (isCleared && showErrors) {
      setShowErrors(false);
    }
  }, [activeFormData, showErrors]);

  const orderLookup = orders.reduce((acc, order) => {
    acc[order.order_id] = order.order_number || 'Order';
    return acc;
  }, {});

  const invoicedOrders = invoices.reduce((acc, invoice) => {
    if (invoice.status !== 'rejected') {
      acc[invoice.order_id] = true;
    }
    return acc;
  }, {});

  const invoiceTotals = invoices.reduce((acc, invoice) => {
    if (invoice.status === 'rejected') return acc;
    acc[invoice.order_id] = Number(invoice.total_amount || 0);
    return acc;
  }, {});

  // Calculate paid amount for each order (exclude failed payments)
  const orderPaidAmounts = payments.reduce((acc, payment) => {
    if (payment.status !== 'failed') {
      acc[payment.order_id] = (acc[payment.order_id] || 0) + parseFloat(payment.amount || 0);
    }
    return acc;
  }, {});

  // Orders with invoices and unpaid balance
  const eligibleOrders = orders.filter((order) => {
    if (order.status !== 'confirmed' || !invoicedOrders[order.order_id]) return false;
    const totalAmount = invoiceTotals[order.order_id] || parseFloat(order.total_amount || 0);
    const paidAmount = orderPaidAmounts[order.order_id] || 0;
    const remaining = totalAmount - paidAmount;
    return remaining > 0.01; // Has balance remaining
  });

  useEffect(() => {
    if (prefillOrderId || focusOrderId || activeFormData.orderId) {
      setActiveTab('create');
    }
  }, [prefillOrderId, focusOrderId, activeFormData.orderId]);
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const getReceiptReference = (payment) => (payment.notes || '').trim();
  const isUrl = (value) => /^https?:\/\//i.test(value);
  const getNextStep = (status) => {
    if (status === 'pending') return 'Mark complete once paid.';
    if (status === 'completed') return 'Waiting for vendor receipt.';
    if (status === 'receipt_sent') return 'Receipt received. Awaiting full settlement.';
    if (status === 'failed') return 'Re-initiate payment.';
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
  const isBlank = (value) => !String(value ?? '').trim();
  const isNumberBlank = (value) => value === '' || value === null || Number.isNaN(Number(value));
  const hasErrors = (
    isBlank(activeFormData.orderId)
    || isBlank(activeFormData.phase)
    || isNumberBlank(activeFormData.amount)
    || isBlank(activeFormData.paymentMode)
    || isBlank(activeFormData.dueDate)
  );
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowErrors(true);
    if (hasErrors) {
      return;
    }
    if (activeSubmit) {
      activeSubmit(e);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === 'all'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            All Payments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === 'create'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Create Payment
          </button>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-base font-semibold text-white shadow hover:bg-slate-700"
        >
          + Initiate Payment
        </button>
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

      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Initiate Payment</h2>
            <p className="text-sm text-slate-500">Create payment record for an order.</p>
          </div>
          {eligibleOrders.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
              No invoiced orders available for payment.
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Order</label>
                  <select
                    name="orderId"
                    value={activeFormData.orderId || ''}
                    onChange={activeInputChange}
                    className={`w-full px-4 py-2 border rounded-lg ${showErrors && isBlank(activeFormData.orderId) ? 'border-rose-500' : 'border-slate-300'}`}
                    required
                  >
                    <option value="">Select order</option>
                    {eligibleOrders.map((order) => {
                      const totalAmount = invoiceTotals[order.order_id] || parseFloat(order.total_amount || 0);
                      const paidAmount = orderPaidAmounts[order.order_id] || 0;
                      const remaining = totalAmount - paidAmount;
                      return (
                        <option key={order.order_id} value={order.order_id}>
                          {order.order_number} (Remaining: ₹{remaining.toFixed(2)})
                        </option>
                      );
                    })}
                  </select>
                  {showErrors && isBlank(activeFormData.orderId) && (
                    <p className="mt-1 text-xs text-rose-600">Order is required.</p>
                  )}
                </div>

                {activeFormData.orderId && (() => {
                  const order = eligibleOrders.find(o => String(o.order_id) === String(activeFormData.orderId));
                  const invoice = invoices.find(inv => String(inv.order_id) === String(activeFormData.orderId));
                  const totalAmount = invoiceTotals[activeFormData.orderId] || parseFloat(order?.total_amount || 0);
                  const paidAmount = orderPaidAmounts[activeFormData.orderId] || 0;
                  const remaining = totalAmount - paidAmount;
                  
                  // Use invoice's advance payment percent (if available, otherwise 50%)
                  const advancePercent = Number(invoice?.advance_payment_percent) || 50;
                  const advanceAmount = (totalAmount * advancePercent) / 100;
                  
                  // Calculate paid by phase
                  const advancePayments = (payments || []).filter(p => 
                    String(p.order_id) === String(activeFormData.orderId) && 
                    p.phase === 'advance' && 
                    p.status !== 'failed'
                  ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                  
                  const installmentPayments = (payments || []).filter(p => 
                    String(p.order_id) === String(activeFormData.orderId) && 
                    p.phase === 'installment' && 
                    p.status !== 'failed'
                  ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                  
                  const finalPayments = (payments || []).filter(p => 
                    String(p.order_id) === String(activeFormData.orderId) && 
                    p.phase === 'final' && 
                    p.status !== 'failed'
                  ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                  
                  const advanceRemaining = Math.max(0, advanceAmount - advancePayments);
                  const isAdvancePaid = advancePayments >= advanceAmount - 0.01;

                  if (remaining <= 0.01) {
                    return (
                      <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">✓ Payment Complete</p>
                            <p className="text-xs text-emerald-700 mt-1">All payments received for this order. Invoice is closed.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForPayments(activeFormData.orderId)}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
                          >
                            View Payment History
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  if (remaining > 0.01) {
                    return (
                      <div className="md:col-span-2">
                        {/* Invoice Details Display */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Invoice Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">Invoice Number</p>
                              <p className="font-semibold text-slate-900">{invoice?.invoice_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Total Amount</p>
                              <p className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Total Paid</p>
                              <p className="font-semibold text-emerald-700">{formatCurrency(paidAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Remaining Balance</p>
                              <p className="font-semibold text-rose-700">{formatCurrency(remaining)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                          <div className={`${isAdvancePaid ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'} border rounded-lg px-3 py-2`}>
                            <p className={`text-xs font-semibold ${isAdvancePaid ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {isAdvancePaid ? '✓ ' : ''}Advance Payment ({advancePercent}%)
                            </p>
                            <p className={`font-bold ${isAdvancePaid ? 'text-emerald-900' : 'text-blue-900'}`}>{formatCurrency(advanceAmount)}</p>
                            <p className={`text-xs mt-1 ${isAdvancePaid ? 'text-emerald-700' : 'text-blue-700'}`}>Paid: {formatCurrency(advancePayments)}</p>
                            {!isAdvancePaid && (
                              <p className="text-xs text-rose-600 font-semibold">Due: {formatCurrency(advanceRemaining)}</p>
                            )}
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-purple-600 font-semibold">Installment Payments</p>
                            <p className="font-bold text-purple-900">{formatCurrency(installmentPayments)}</p>
                            <p className="text-xs text-purple-700 mt-1">
                              {(payments || []).filter(p => String(p.order_id) === String(activeFormData.orderId) && p.phase === 'installment' && p.status !== 'failed').length} payment(s)
                            </p>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-amber-600 font-semibold">Final Payment</p>
                            <p className="font-bold text-amber-900">{formatCurrency(finalPayments)}</p>
                            <p className="text-xs text-amber-700 mt-1">{finalPayments > 0 ? '✓ Done' : 'Pending'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {activeFormData.orderId && (() => {
                  const order = eligibleOrders.find(o => String(o.order_id) === String(activeFormData.orderId));
                  const invoice = invoices.find(inv => String(inv.order_id) === String(activeFormData.orderId));
                  const totalAmount = invoiceTotals[activeFormData.orderId] || parseFloat(order?.total_amount || 0);
                  const paidAmount = orderPaidAmounts[activeFormData.orderId] || 0;
                  const remaining = totalAmount - paidAmount;
                  
                  // Use invoice's advance payment percent (if available, otherwise 50%)
                  const advancePercent = Number(invoice?.advance_payment_percent) || 50;
                  const advanceAmount = (totalAmount * advancePercent) / 100;
                  const advancePayments = (payments || []).filter(p => 
                    String(p.order_id) === String(activeFormData.orderId) && 
                    p.phase === 'advance' && 
                    p.status !== 'failed'
                  ).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                  const isAdvancePaid = advancePayments >= advanceAmount - 0.01;

                  if (remaining > 0.01) {
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Phase <span className="text-rose-600">*</span></label>
                          <select
                            name="phase"
                            value={activeFormData.phase || ''}
                            onChange={(e) => {
                              const phase = e.target.value;
                              let autoAmount = '';
                              
                              if (phase === 'advance') {
                                autoAmount = advanceAmount.toFixed(2);
                              } else if (phase === 'final') {
                                autoAmount = remaining.toFixed(2);
                              } else if (phase === 'installment') {
                                autoAmount = '';
                              }
                              
                              activeInputChange(e);
                              activeInputChange({ target: { name: 'amount', value: autoAmount } });
                            }}
                            className={`w-full px-4 py-2 border rounded-lg ${showErrors && isBlank(activeFormData.phase) ? 'border-rose-500' : 'border-slate-300'}`}
                            required
                          >
                            <option value="">Select payment phase</option>
                            {!isAdvancePaid && <option value="advance">Advance ({advancePercent}% - ₹{advanceAmount.toFixed(2)})</option>}
                            <option value="installment">Installment (Partial Payment)</option>
                            <option value="final">Final (Remaining - ₹{remaining.toFixed(2)})</option>
                          </select>
                          {showErrors && isBlank(activeFormData.phase) && (
                            <p className="mt-1 text-xs text-rose-600">Payment phase is required.</p>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            {!isAdvancePaid && `Start with Advance payment (${advancePercent}%) or add Installments •`}
                            {isAdvancePaid && 'Make Installment payments or Final payment to close invoice'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Amount <span className="text-rose-600">*</span></label>
                          <input
                            type="number"
                            name="amount"
                            value={activeFormData.amount || ''}
                            onChange={activeInputChange}
                            step="0.01"
                            min="0"
                            max={remaining}
                            readOnly={activeFormData.phase === 'advance' || activeFormData.phase === 'final'}
                            className={`w-full px-4 py-2 border rounded-lg ${showErrors && isNumberBlank(activeFormData.amount) ? 'border-rose-500' : 'border-slate-300'} ${
                              (activeFormData.phase === 'advance' || activeFormData.phase === 'final') ? 'bg-slate-50 cursor-not-allowed' : ''
                            }`}
                            required
                          />
                          {showErrors && isNumberBlank(activeFormData.amount) && (
                            <p className="mt-1 text-xs text-rose-600">Amount is required.</p>
                          )}
                          {activeFormData.phase === 'advance' && (
                            <p className="text-xs text-blue-600 mt-1 font-semibold">
                              ✓ Auto-filled: {advancePercent}% of total amount
                            </p>
                          )}
                          {activeFormData.phase === 'final' && (
                            <p className="text-xs text-amber-600 mt-1 font-semibold">
                              ✓ Auto-filled: Remaining balance (closes invoice)
                            </p>
                          )}
                          {activeFormData.phase === 'installment' && (
                            <p className="text-xs text-purple-600 mt-1">
                              Enter any amount up to ₹{remaining.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Mode <span className="text-rose-600">*</span></label>
                          <select
                            name="paymentMode"
                            value={activeFormData.paymentMode || ''}
                            onChange={activeInputChange}
                            className={`w-full px-4 py-2 border rounded-lg ${showErrors && isBlank(activeFormData.paymentMode) ? 'border-rose-500' : 'border-slate-300'}`}
                            required
                          >
                            <option value="">Select mode</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="upi">UPI</option>
                            <option value="cash">Cash</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="other">Other</option>
                          </select>
                          {showErrors && isBlank(activeFormData.paymentMode) && (
                            <p className="mt-1 text-xs text-rose-600">Payment mode is required.</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Due Date <span className="text-rose-600">*</span></label>
                          <input
                            type="date"
                            name="dueDate"
                            value={activeFormData.dueDate || ''}
                            onChange={activeInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-2 border rounded-lg ${showErrors && isBlank(activeFormData.dueDate) ? 'border-rose-500' : 'border-slate-300'}`}
                            required
                          />
                          {showErrors && isBlank(activeFormData.dueDate) && (
                            <p className="mt-1 text-xs text-rose-600">Due date is required.</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (Optional)</label>
                          <textarea
                            name="notes"
                            value={activeFormData.notes || ''}
                            onChange={activeInputChange}
                            placeholder="Add payment notes or reference..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg resize-none"
                            rows="2"
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition"
                          >
                            Create Payment
                          </button>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </form>
            </>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <>
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
              <h3 className="text-lg font-semibold text-slate-900">Payments</h3>
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
                    {payment.status === 'pending' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onComplete(payment.payment_id);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFail(payment.payment_id);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg"
                        >
                          Fail
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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
                const orderId = selectedPayment.order_id;
                const order = orders.find((entry) => String(entry.order_id) === String(orderId));
                const totalAmount = invoiceTotals[orderId] || Number(order?.total_amount || 0);
                const paidAmount = orderPaidAmounts[orderId] || 0;
                const advancePercent = Number(order?.advance_payment_percent || 0);
                const advanceAmount = Number(order?.advance_amount || 0) || (totalAmount * advancePercent / 100);
                const remaining = Math.max(0, totalAmount - paidAmount);
                return (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Total Amount</label>
                      <p className="text-sm text-slate-900">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Paid Till Date</label>
                      <p className="text-sm text-slate-900">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Pending Amount</label>
                      <p className="text-sm text-slate-900">{formatCurrency(remaining)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Advance Expected</label>
                      <p className="text-sm text-slate-900">{formatCurrency(advanceAmount)}</p>
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
              {onGoToInvoices && (
                <button
                  onClick={() => {
                    onGoToInvoices(selectedPayment.order_id);
                    setSelectedPayment(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  View Invoices
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedOrderForPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Payments Received</p>
                <h2 className="text-xl font-semibold text-slate-900">{orderLookup[selectedOrderForPayments] || 'Order'}</h2>
              </div>
              <button
                onClick={() => setSelectedOrderForPayments(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {payments
                .filter((p) => String(p.order_id) === String(selectedOrderForPayments) && p.status !== 'failed')
                .length === 0 ? (
                <p className="text-sm text-slate-500">No payments received for this order.</p>
              ) : (
                <div className="space-y-3">
                  {payments
                    .filter((p) => String(p.order_id) === String(selectedOrderForPayments) && p.status !== 'failed')
                    .map((payment) => (
                      <div key={payment.payment_id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-slate-600 mt-1">Phase: {payment.phase || '—'}</p>
                            <p className="text-xs text-slate-600">Mode: {payment.payment_mode || '—'}</p>
                            <p className="text-xs text-slate-600">Paid: {formatDate(payment.payment_date)}</p>
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
                onClick={() => setSelectedOrderForPayments(null)}
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

export default PurchasePaymentsTab;
