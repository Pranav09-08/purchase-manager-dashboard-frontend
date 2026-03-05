import { useEffect, useState } from 'react';

// Purchase LOI list and create form
function PurchaseLoisTab({ lois, quotations, counters, orders = [], vendorLookup = {}, componentLookup = {}, loiFormData = {}, onLoiInputChange, onSelectQuotation, onSelectCounter, onSubmit, onGenerateOrder, onGoToOrders, onResubmitLoi, onEditLoi, editingLoiId, focusQuotationId, focusCounterId, onClearFocus, onLoiSubmit }) {
  const [selectedLoi, setSelectedLoi] = useState(null);
  const [selectedQuotationDetail, setSelectedQuotationDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loiSearch, setLoiSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [showErrors, setShowErrors] = useState(false);
  
  // Calculate aggregate totals from items
  const getAggregateTotals = (items) => {
    if (!items || items.length === 0) {
      return {
        baseSubtotal: 0,
        discountAmount: 0,
        taxableSubtotal: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        grandTotal: 0,
      };
    }

    let baseSubtotal = 0;
    let discountAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;

    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const discountPercent = Number(item.discount_percent || 0);
      const cgstPercent = Number(item.cgst_percent || 0);
      const sgstPercent = Number(item.sgst_percent || 0);

      const lineBase = qty * unitPrice;
      const lineDiscount = lineBase * (discountPercent / 100);
      const lineTaxable = lineBase - lineDiscount;
      const lineCgst = lineTaxable * (cgstPercent / 100);
      const lineSgst = lineTaxable * (sgstPercent / 100);

      baseSubtotal += lineBase;
      discountAmount += lineDiscount;
      cgstAmount += lineCgst;
      sgstAmount += lineSgst;
    });

    const taxableSubtotal = baseSubtotal - discountAmount;
    const grandTotal = taxableSubtotal + cgstAmount + sgstAmount;

    return {
      baseSubtotal,
      discountAmount,
      taxableSubtotal,
      cgstAmount,
      sgstAmount,
      grandTotal,
    };
  };
  
  const quotationLookup = quotations.reduce((acc, quotation) => {
    acc[quotation.quotation_id] = quotation.quotation_number;
    return acc;
  }, {});

  // Auto-populate form when focusing on a specific quotation or counter
  useEffect(() => {
    if (focusCounterId && onSelectCounter) {
      const counter = counters.find(c => String(c.counter_id) === String(focusCounterId));
      if (counter) {
        onSelectCounter(counter);
      }
    } else if (focusQuotationId && onSelectQuotation) {
      const quotation = quotations.find(q => String(q.quotation_id) === String(focusQuotationId));
      if (quotation) {
        onSelectQuotation(quotation);
      }
    }
  }, [focusQuotationId, focusCounterId, quotations, counters, onSelectQuotation, onSelectCounter]);

  useEffect(() => {
    if (loiFormData.quotationId || loiFormData.counterQuotationId) {
      setActiveTab('create');
    }
  }, [loiFormData.quotationId, loiFormData.counterQuotationId]);
  useEffect(() => {
    if (editingLoiId) {
      setActiveTab('create');
    }
  }, [editingLoiId]);
  // Reset error flags when form is cleared (after successful submission)
  // Check if form is in cleared/initial state by checking multiple fields
  useEffect(() => {
    // If all key fields are empty, form was just cleared - reset errors
    const isCleared = !loiFormData.quotationId && !loiFormData.totalAmount && !loiFormData.expectedDeliveryDate;
    if (isCleared && showErrors) {
      setShowErrors(false);
    }
  }, [loiFormData, showErrors]);
  const getNextStep = (status) => {
    if (status === 'sent') return 'Waiting for vendor response.';
    if (status === 'accepted') return 'Generate the purchase order.';
    if (status === 'rejected') return 'Review and decide next action.';
    if (status === 'confirmed') return 'Order generated.';
    return 'LOI in progress.';
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
  const resolveQuotationId = (loi) => loi.quotation_id || loi.quotationId;
  const resolveCounterId = (loi) => loi.counter_quotation_id || loi.counterQuotationId;
  const focusQuoteId = focusQuotationId ? String(focusQuotationId) : '';
  const focusCounter = focusCounterId ? String(focusCounterId) : '';
  const focusLois = (focusQuoteId || focusCounter)
    ? lois.filter((loi) => {
      if (focusCounter) return String(resolveCounterId(loi)) === focusCounter;
      return String(resolveQuotationId(loi)) === focusQuoteId;
    })
    : lois;
  const filteredLois = focusLois.filter((loi) => {
    const number = (loi.loi_number || '').toLowerCase();
    const vendor = (vendorLookup[loi.vendor_id] || '').toLowerCase();
    const matchesSearch = number.includes(loiSearch.toLowerCase()) || vendor.includes(loiSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const sortedLois = [...filteredLois].sort((a, b) => {
    const aDate = new Date(a.loi_date || a.created_at || 0).getTime();
    const bDate = new Date(b.loi_date || b.created_at || 0).getTime();
    const aVendor = (vendorLookup[a.vendor_id] || '').toLowerCase();
    const bVendor = (vendorLookup[b.vendor_id] || '').toLowerCase();

    switch (sortOrder) {
      case 'date_asc':
        return aDate - bDate;
      case 'vendor_asc':
        return aVendor.localeCompare(bVendor);
      case 'vendor_desc':
        return bVendor.localeCompare(aVendor);
      default:
        return bDate - aDate;
    }
  });
  const isBlank = (value) => !String(value ?? '').trim();
  const isNumberBlank = (value) => value === '' || value === null || Number.isNaN(Number(value));
  const hasErrors = isBlank(loiFormData.quotationId);
  const handleSubmit = (e) => {
    setShowErrors(true);
    if (hasErrors) {
      e.preventDefault();
      return;
    }
    if (onLoiSubmit) {
      onLoiSubmit(e);
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
            All LOIs
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
            Create LOI
          </button>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-base font-semibold text-white shadow hover:bg-slate-700"
        >
          + Create New LOI
        </button>
      </div>

      {(focusQuoteId || focusCounter) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Showing LOIs for {focusCounter ? 'counter quotation' : 'quotation'}{' '}
            <span className="font-semibold">{focusCounter || focusQuoteId}</span>.
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
            <h2 className="text-2xl font-semibold text-slate-900">{editingLoiId ? 'Edit LOI' : 'Create LOI'}</h2>
            <p className="text-sm text-slate-500">
              {editingLoiId ? 'Update LOI details before vendor approval.' : 'Issue a letter of intent to a vendor.'}
            </p>
          </div>
          
          {loiFormData.quotationId && !editingLoiId && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Creating LOI from Accepted Quotation</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Form has been pre-filled with quotation details. Review and adjust as needed before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Quotation */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Quotation
                {loiFormData.quotationId && quotations.find(q => q.quotation_id === loiFormData.quotationId)?.status === 'accepted' && (
                  <span className="ml-2 text-xs text-emerald-600">(Pre-selected from accepted quotation)</span>
                )}
              </label>
              <select
                value={loiFormData.quotationId}
                onChange={(e) => onSelectQuotation(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg ${showErrors && isBlank(loiFormData.quotationId) ? 'border-rose-500' : 'border-slate-300'}`}
                required
              >
                <option value="">Select quotation</option>
                {quotations.map((quotation) => (
                  <option key={quotation.quotation_id} value={quotation.quotation_id}>
                    {quotation.quotation_number} · {vendorLookup[quotation.vendor_id] || 'Vendor'}
                  </option>
                ))}
              </select>
              {showErrors && isBlank(loiFormData.quotationId) && (
                <p className="mt-1 text-xs text-rose-600">Quotation is required.</p>
              )}
            </div>

            {/* Step 2: Quotation Details and Line Items */}
            {loiFormData.quotationId && quotations.find(q => q.quotation_id === loiFormData.quotationId) && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Quotation Details</h4>
                    <button
                      type="button"
                      onClick={() => setSelectedQuotationDetail(quotations.find(q => q.quotation_id === loiFormData.quotationId))}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      View Full Quotation
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Quick Summary */}
                  <div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="border border-slate-200 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Status</div>
                        <div className="text-sm font-semibold text-slate-900">{quotations.find(q => q.quotation_id === loiFormData.quotationId)?.status || 'N/A'}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Quotation Total</div>
                        <div className="text-sm font-semibold text-slate-900">₹{Number(quotations.find(q => q.quotation_id === loiFormData.quotationId)?.total_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Delivery Date</div>
                        <div className="text-sm font-semibold text-slate-900">{quotations.find(q => q.quotation_id === loiFormData.quotationId)?.expected_delivery_date ? new Date(quotations.find(q => q.quotation_id === loiFormData.quotationId).expected_delivery_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  {quotations.find(q => q.quotation_id === loiFormData.quotationId)?.items?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-slate-600 uppercase mb-3">Line Items</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-xs uppercase bg-slate-50">
                            <tr className="border-b border-slate-200">
                              <th className="py-2 px-3 text-left font-semibold">Component</th>
                              <th className="py-2 px-3 text-right font-semibold">Qty</th>
                              <th className="py-2 px-3 text-right font-semibold">Unit Price</th>
                              <th className="py-2 px-3 text-right font-semibold">Disc %</th>
                              <th className="py-2 px-3 text-right font-semibold">CGST %</th>
                              <th className="py-2 px-3 text-right font-semibold">SGST %</th>
                              <th className="py-2 px-3 text-right font-semibold">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quotations.find(q => q.quotation_id === loiFormData.quotationId)?.items?.map((item) => (
                              <tr key={item.item_id} className="border-b border-slate-100">
                                <td className="py-2 px-3 text-slate-700">{componentLookup[item.component_id] || componentLookup[String(item.component_id || '').toLowerCase()] || item.component_name || item.component_id || 'Component'}</td>
                                <td className="py-2 px-3 text-right text-slate-700">{item.quantity}</td>
                                <td className="py-2 px-3 text-right text-slate-700">₹{Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
                                <td className="py-2 px-3 text-right text-slate-700">{item.discount_percent || 0}%</td>
                                <td className="py-2 px-3 text-right text-slate-700">{item.cgst_percent || 0}%</td>
                                <td className="py-2 px-3 text-right text-slate-700">{item.sgst_percent || 0}%</td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-900">₹{Number(item.line_total || 0).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Summary */}
                      {(() => {
                        const selectedQuotation = quotations.find(q => q.quotation_id === loiFormData.quotationId);
                        if (!selectedQuotation?.items?.length) return null;
                        
                        const totals = getAggregateTotals(selectedQuotation.items);
                        const discountPercent = totals.baseSubtotal > 0 ? ((totals.discountAmount / totals.baseSubtotal) * 100).toFixed(2) : '0.00';
                        const cgstPercent = totals.taxableSubtotal > 0 ? ((totals.cgstAmount / totals.taxableSubtotal) * 100).toFixed(2) : '0.00';
                        const sgstPercent = totals.taxableSubtotal > 0 ? ((totals.sgstAmount / totals.taxableSubtotal) * 100).toFixed(2) : '0.00';
                        
                        return (
                          <div className="mt-6 space-y-3">
                            <h5 className="text-xs font-semibold text-slate-600 uppercase">Financial Summary</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="border border-slate-200 rounded-lg p-3">
                                <div className="text-xs text-slate-500 mb-1">Total Base Price</div>
                                <div className="text-lg font-bold text-slate-900">{formatCurrency(totals.baseSubtotal)}</div>
                              </div>
                              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                                <div className="text-xs text-amber-700 mb-1">Discount Applied ({discountPercent}%)</div>
                                <div className="text-lg font-bold text-amber-900">-{formatCurrency(totals.discountAmount)}</div>
                              </div>
                              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                                <div className="text-xs text-blue-700 mb-1">CGST Applied ({cgstPercent}%)</div>
                                <div className="text-lg font-bold text-blue-900">+{formatCurrency(totals.cgstAmount)}</div>
                              </div>
                              <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3">
                                <div className="text-xs text-indigo-700 mb-1">SGST Applied ({sgstPercent}%)</div>
                                <div className="text-lg font-bold text-indigo-900">+{formatCurrency(totals.sgstAmount)}</div>
                              </div>
                            </div>
                            <div className="border-2 border-emerald-300 bg-emerald-50 rounded-lg p-4">
                              <div className="text-xs text-emerald-700 mb-1 uppercase font-semibold">Total Price</div>
                              <div className="text-2xl font-bold text-emerald-900">{formatCurrency(totals.grandTotal)}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: LOI Details (Read-Only) */}
            {loiFormData.quotationId && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">LOI Details (Read-Only - From Quotation)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Total Amount</label>
                    <input
                      type="text"
                      name="totalAmount"
                      value={formatCurrency(loiFormData.totalAmount || 0)}
                      readOnly
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-slate-500">Auto-filled from quotation</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Delivery Date</label>
                    <input
                      type="date"
                      name="expectedDeliveryDate"
                      value={loiFormData.expectedDeliveryDate}
                      readOnly
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-slate-500">Auto-filled from quotation</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Terms & Conditions (Editable) */}
            {loiFormData.quotationId && (
              <div className="bg-white rounded-xl border border-emerald-200 p-6 border-2">
                <h4 className="text-sm font-semibold text-emerald-900 mb-4">Terms & Conditions (Editable)</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Terms & Conditions <span className="text-xs text-slate-500">(edit as needed)</span>
                  </label>
                  <textarea
                    name="termsAndConditions"
                    value={loiFormData.termsAndConditions || ''}
                    onChange={onLoiInputChange}
                    placeholder="Enter terms and conditions for this LOI..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <p className="mt-1 text-xs text-slate-500">Pre-filled from quotation, edit as needed</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {loiFormData.quotationId && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    onClearFocus?.();
                  }}
                  className="px-5 py-2.5 rounded-lg font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!loiFormData.quotationId}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition ${
                    !loiFormData.quotationId
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                  title={!loiFormData.quotationId ? 'Please select a quotation' : ''}
                >
                  {editingLoiId ? 'Update LOI' : 'Create LOI'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {activeTab === 'all' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search LOIs by number or vendor..."
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
                <option value="vendor_asc">Vendor A-Z</option>
                <option value="vendor_desc">Vendor Z-A</option>
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
                        <p className="text-xs text-slate-500">
                          {vendorLookup[loi.vendor_id] || 'Vendor'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{getNextStep(loi.status)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loi.status)}`}>
                          {loi.status || 'new'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(loi.total_amount)}</span>
                      </div>
                    </div>
                    {loi.status === 'accepted' && !hasOrder(loi.loi_id) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateOrder(loi);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                        >
                          Generate Order
                        </button>
                      </div>
                    )}
                    {hasOrder(loi.loi_id) && (
                      <div className="mt-3">
                        <span className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg inline-block">
                          Order Created ✓
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selectedLoi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">LOI Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedLoi.loi_number}</h2>
                <p className="text-xs text-slate-500 mt-1">Vendor: {vendorLookup[selectedLoi.vendor_id] || 'Vendor'}</p>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Quotation</label>
                  <p className="text-sm text-slate-900">{quotationLookup[selectedLoi.quotation_id] || 'Quotation'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedLoi.status)}`}>
                    {selectedLoi.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Amount</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedLoi.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Delivery</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedLoi.expected_delivery_date)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Terms & Conditions</label>
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
              {onGoToOrders && !hasOrder(selectedLoi.loi_id) && (
                <button
                  onClick={() => {
                    onGoToOrders(selectedLoi);
                    setSelectedLoi(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  Create Order
                </button>
              )}
              {onEditLoi && ['sent', 'rejected'].includes(selectedLoi.status || 'sent') && (
                <button
                  onClick={() => {
                    onEditLoi(selectedLoi);
                    setSelectedLoi(null);
                    setActiveTab('create');
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition"
                >
                  Edit LOI
                </button>
              )}
              {hasOrder(selectedLoi.loi_id) && (
                <span className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                  Order Created ✓
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedQuotationDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Quotation Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedQuotationDetail.quotation_number || 'Quotation'}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vendor: {vendorLookup[selectedQuotationDetail.vendor_id] || 'Vendor'}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuotationDetail(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {selectedQuotationDetail.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedQuotationDetail.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Date</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedQuotationDetail.expected_delivery_date)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Line Items</h4>
                {selectedQuotationDetail.items?.length ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="text-xs uppercase bg-slate-100">
                          <tr className="border-b border-slate-200">
                            <th className="py-2 px-2 text-left">Component</th>
                            <th className="py-2 px-2 text-right">Qty</th>
                            <th className="py-2 px-2 text-right">Unit Price</th>
                            <th className="py-2 px-2 text-right">Discount %</th>
                            <th className="py-2 px-2 text-right">CGST %</th>
                            <th className="py-2 px-2 text-right">SGST %</th>
                            <th className="py-2 px-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedQuotationDetail.items.map((item) => (
                            <tr key={item.item_id} className="border-b border-slate-100">
                              <td className="py-2 px-2 text-slate-700">{componentLookup[item.component_id] || item.component_name || 'Component'}</td>
                              <td className="py-2 px-2 text-right text-slate-700">{item.quantity}</td>
                              <td className="py-2 px-2 text-right text-slate-700">₹{Number(item.unit_price || 0).toLocaleString('en-IN')}</td>
                              <td className="py-2 px-2 text-right text-slate-700">{item.discount_percent || 0}%</td>
                              <td className="py-2 px-2 text-right text-slate-700">{item.cgst_percent || 0}%</td>
                              <td className="py-2 px-2 text-right text-slate-700">{item.sgst_percent || 0}%</td>
                              <td className="py-2 px-2 text-right font-semibold text-slate-900">₹{Number(item.line_total || 0).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const totals = getAggregateTotals(selectedQuotationDetail.items);
                      const discountPercent = totals.baseSubtotal > 0 ? ((totals.discountAmount / totals.baseSubtotal) * 100).toFixed(2) : '0.00';
                      const cgstPercent = totals.taxableSubtotal > 0 ? ((totals.cgstAmount / totals.taxableSubtotal) * 100).toFixed(2) : '0.00';
                      const sgstPercent = totals.taxableSubtotal > 0 ? ((totals.sgstAmount / totals.taxableSubtotal) * 100).toFixed(2) : '0.00';
                      return (
                        <div className="mt-6 space-y-3">
                          <h4 className="text-sm font-semibold text-slate-700">Final Summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="border border-slate-200 rounded-lg p-3">
                              <div className="text-xs text-slate-500 mb-1">Total Base Price</div>
                              <div className="text-lg font-bold text-slate-900">{formatCurrency(totals.baseSubtotal)}</div>
                            </div>
                            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                              <div className="text-xs text-amber-700 mb-1">Discount Applied ({discountPercent}%)</div>
                              <div className="text-lg font-bold text-amber-900">-{formatCurrency(totals.discountAmount)}</div>
                            </div>
                            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                              <div className="text-xs text-blue-700 mb-1">CGST Applied ({cgstPercent}%)</div>
                              <div className="text-lg font-bold text-blue-900">+{formatCurrency(totals.cgstAmount)}</div>
                            </div>
                            <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3">
                              <div className="text-xs text-indigo-700 mb-1">SGST Applied ({sgstPercent}%)</div>
                              <div className="text-lg font-bold text-indigo-900">+{formatCurrency(totals.sgstAmount)}</div>
                            </div>
                          </div>
                          <div className="border-2 border-emerald-300 bg-emerald-50 rounded-lg p-4">
                            <div className="text-xs text-emerald-700 mb-1 uppercase font-semibold">Total Price</div>
                            <div className="text-2xl font-bold text-emerald-900">{formatCurrency(totals.grandTotal)}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No items available.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedQuotationDetail(null)}
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

export default PurchaseLoisTab;
