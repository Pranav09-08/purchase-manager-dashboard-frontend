import { useEffect, useState } from 'react';

// Vendor quotations and counter-quotation submission
function QuotationsTab({
  quotations = [],
  counters = [],
  enquiries = [],
  lois = [],
  componentCatalog = [],
  quotationForm = {},
  quotationItems = [],
  onSelectEnquiry = () => {},
  onQuotationInputChange = () => {},
  onQuotationItemAdd = () => {},
  onQuotationItemRemove = () => {},
  onQuotationItemChange = () => {},
  onQuotationSubmit = () => {},
  counterForm = {},
  counterItems = [],
  onCounterInputChange = () => {},
  onCounterItemAdd = () => {},
  onCounterItemRemove = () => {},
  onCounterItemChange = () => {},
  onCounterSubmit = () => {},
  onGoToLois = () => {},
}) {
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatus, setQuotationStatus] = useState('all');
  const [counterSearch, setCounterSearch] = useState('');
  const [counterStatus, setCounterStatus] = useState('all');
  const [showQuotationErrors, setShowQuotationErrors] = useState(false);
  const [showCounterErrors, setShowCounterErrors] = useState(false);
  useEffect(() => {
    if (quotationForm?.enquiryId) {
      setActiveTab('create');
    }
  }, [quotationForm?.enquiryId]);
  // Reset error flags when form is cleared (after successful submission)
  useEffect(() => {
    // If all key fields are empty, form was just cleared - reset errors
    const isCleared = !quotationForm?.enquiryId && !quotationForm?.validTill && !quotationForm?.expectedDeliveryDate;
    if (isCleared && showQuotationErrors) {
      setShowQuotationErrors(false);
    }
  }, [quotationForm, showQuotationErrors]);
  useEffect(() => {
    // If all key fields are empty, form was just cleared - reset errors
    const isCleared = !counterForm?.quotationId && !counterForm?.validTill && !counterForm?.expectedDeliveryDate;
    if (isCleared && showCounterErrors) {
      setShowCounterErrors(false);
    }
  }, [counterForm, showCounterErrors]);
  const componentLookup = componentCatalog.reduce((acc, component) => {
    const componentId = component.componentId || component.componentid || component.component_id || component.id;
    if (!componentId) return acc;
    // Store with both the original key and string version to handle type mismatches
    acc[componentId] = component;
    acc[String(componentId)] = component;
    return acc;
  }, {});

  const getItemTotals = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const cgstPercent = Number(item.cgstPercent) || 0;
    const sgstPercent = Number(item.sgstPercent) || 0;
    const baseAmount = quantity * unitPrice;
    const discountAmount = (baseAmount * discountPercent) / 100;
    const subtotal = baseAmount - discountAmount;
    const cgstAmount = (subtotal * cgstPercent) / 100;
    const sgstAmount = (subtotal * sgstPercent) / 100;
    return {
      subtotal,
      cgstAmount,
      sgstAmount,
      total: subtotal + cgstAmount + sgstAmount,
    };
  };
  const getAggregateTotals = (items = [], mode = 'form') => {
    return (items || []).reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = mode === 'form'
        ? (Number(item.unitPrice) || 0)
        : (Number(item.unit_price ?? item.unitPrice) || 0);
      const discountPercent = mode === 'form'
        ? (Number(item.discountPercent) || 0)
        : (Number(item.discount_percent ?? item.discountPercent) || 0);
      const cgstPercent = mode === 'form'
        ? (Number(item.cgstPercent) || 0)
        : (Number(item.cgst_percent ?? item.cgstPercent) || 0);
      const sgstPercent = mode === 'form'
        ? (Number(item.sgstPercent) || 0)
        : (Number(item.sgst_percent ?? item.sgstPercent) || 0);

      const baseSubtotal = quantity * unitPrice;
      const discountAmount = (baseSubtotal * discountPercent) / 100;
      const taxableSubtotal = baseSubtotal - discountAmount;
      const cgstAmount = (taxableSubtotal * cgstPercent) / 100;
      const sgstAmount = (taxableSubtotal * sgstPercent) / 100;
      const grandTotal = taxableSubtotal + cgstAmount + sgstAmount;

      return {
        baseSubtotal: acc.baseSubtotal + baseSubtotal,
        discountAmount: acc.discountAmount + discountAmount,
        taxableSubtotal: acc.taxableSubtotal + taxableSubtotal,
        cgstAmount: acc.cgstAmount + cgstAmount,
        sgstAmount: acc.sgstAmount + sgstAmount,
        grandTotal: acc.grandTotal + grandTotal,
      };
    }, {
      baseSubtotal: 0,
      discountAmount: 0,
      taxableSubtotal: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      grandTotal: 0,
    });
  };
  const quotationFormTotals = getAggregateTotals(quotationItems, 'form');
  const quotationFormDiscountPercent = quotationFormTotals.baseSubtotal > 0
    ? (quotationFormTotals.discountAmount / quotationFormTotals.baseSubtotal) * 100
    : 0;
  const quotationFormCgstPercent = quotationFormTotals.taxableSubtotal > 0
    ? (quotationFormTotals.cgstAmount / quotationFormTotals.taxableSubtotal) * 100
    : 0;
  const quotationFormSgstPercent = quotationFormTotals.taxableSubtotal > 0
    ? (quotationFormTotals.sgstAmount / quotationFormTotals.taxableSubtotal) * 100
    : 0;
  const selectedQuotationTotals = getAggregateTotals(selectedQuotation?.items || [], 'submitted');
  const selectedQuotationDiscountPercent = selectedQuotationTotals.baseSubtotal > 0
    ? (selectedQuotationTotals.discountAmount / selectedQuotationTotals.baseSubtotal) * 100
    : 0;
  const selectedQuotationCgstPercent = selectedQuotationTotals.taxableSubtotal > 0
    ? (selectedQuotationTotals.cgstAmount / selectedQuotationTotals.taxableSubtotal) * 100
    : 0;
  const selectedQuotationSgstPercent = selectedQuotationTotals.taxableSubtotal > 0
    ? (selectedQuotationTotals.sgstAmount / selectedQuotationTotals.taxableSubtotal) * 100
    : 0;
  const getQuotationNextStep = (status) => {
    if (status === 'sent') return 'Waiting for purchase manager response.';
    if (status === 'negotiating') return 'Prepare counter quotation if requested.';
    if (status === 'accepted') return 'Await LOI.';
    if (status === 'rejected') return 'Closed.';
    return 'Quotation in progress.';
  };
  const getCounterNextStep = (status) => {
    if (status === 'pending') return 'Await purchase manager decision.';
    if (status === 'accepted') return 'Await LOI.';
    if (status === 'rejected') return 'Closed.';
    return 'Counter in progress.';
  };

  // Check if LOI already exists for quotation or counter
  const hasLoi = (quotationId, counterId) => {
    return lois.some((loi) => {
      const loiQuotationId = loi.quotation_id || loi.quotationId;
      const loiCounterId = loi.counter_quotation_id || loi.counterQuotationId;
      if (counterId) return String(loiCounterId) === String(counterId);
      return String(loiQuotationId) === String(quotationId);
    });
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const getStatusColor = (status) => {
    if (status === 'sent' || status === 'pending') return 'bg-blue-100 text-blue-700';
    if (status === 'negotiating') return 'bg-amber-100 text-amber-700';
    if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  const filteredQuotations = quotations.filter((quotation) => {
    const number = (quotation.quotation_number || '').toLowerCase();
    const matchesSearch = number.includes(quotationSearch.toLowerCase());
    const matchesStatus = quotationStatus === 'all' || quotation.status === quotationStatus;
    return matchesSearch && matchesStatus;
  });
  const filteredCounters = counters.filter((counter) => {
    const number = (counter.counter_number || '').toLowerCase();
    const action = (counter.action || '').toLowerCase();
    const matchesSearch = number.includes(counterSearch.toLowerCase()) || action.includes(counterSearch.toLowerCase());
    const matchesStatus = counterStatus === 'all' || counter.status === counterStatus;
    return matchesSearch && matchesStatus;
  });
  const isBlank = (value) => !String(value ?? '').trim();
  const isNumberBlank = (value) => value === '' || value === null || Number.isNaN(Number(value));
  const isQuantityInvalid = (value) => Number(value) <= 0;
  const quotationHasItemErrors = quotationItems.some((item) => (
    isQuantityInvalid(item.quantity)
    || isNumberBlank(item.unitPrice)
    || isNumberBlank(item.discountPercent)
    || isNumberBlank(item.cgstPercent)
    || isNumberBlank(item.sgstPercent)
  ));
  const quotationHasErrors = (
    isBlank(quotationForm.enquiryId)
    || isBlank(quotationForm.validTill)
    || isBlank(quotationForm.expectedDeliveryDate)
    || isNumberBlank(quotationForm.advancePaymentPercent)
    || isBlank(quotationForm.notes)
    || quotationItems.length === 0
    || quotationHasItemErrors
  );
  const counterNeedsItems = counterForm.action === 'negotiate';
  const counterNeedsRejectionReason = counterForm.action === 'reject';
  const counterNeedsNotes = counterForm.action === 'negotiate';
  const counterHasItemErrors = counterNeedsItems && counterItems.some((item) => (
    isBlank(item.componentId)
    || isQuantityInvalid(item.quantity)
    || isNumberBlank(item.unitPrice)
    || isNumberBlank(item.discountPercent)
    || isNumberBlank(item.cgstPercent)
    || isNumberBlank(item.sgstPercent)
  ));
  const counterHasErrors = (
    isBlank(counterForm.quotationId)
    || isBlank(counterForm.action)
    || isBlank(counterForm.validTill)
    || isBlank(counterForm.expectedDeliveryDate)
    || isNumberBlank(counterForm.advancePaymentPercent)
    || (counterNeedsRejectionReason && isBlank(counterForm.rejectionReason))
    || (counterNeedsNotes && isBlank(counterForm.negotiationNotes))
    || (counterNeedsItems && counterItems.length === 0)
    || counterHasItemErrors
  );
  const handleQuotationSubmit = (e) => {
    setShowQuotationErrors(true);
    if (quotationHasErrors) {
      e.preventDefault();
      return;
    }
    onQuotationSubmit(e);
  };
  const handleCounterSubmit = (e) => {
    setShowCounterErrors(true);
    if (counterHasErrors) {
      e.preventDefault();
      return;
    }
    onCounterSubmit(e);
  };
  const counterEligibleQuotations = quotations.filter((quotation) => (
    ['sent', 'negotiating'].includes(quotation.status)
  ));
  const quotationEligibleEnquiries = enquiries.filter((enquiry) => (
    ['raised', 'pending', 'new', 'accepted'].includes(enquiry.status || 'new')
  ));

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
            All Quotations
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
            Create Quotation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('counter')}
            className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
              activeTab === 'counter'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            Counter Quotation
          </button>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-base font-semibold text-white shadow hover:bg-slate-700"
        >
          + Create Quotation
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-2xl font-semibold text-slate-900">Create Quotation</h3>
            <p className="text-sm text-slate-500">Send quotation for a purchase enquiry.</p>
          </div>
          <form onSubmit={handleQuotationSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Enquiry</label>
            <select
              name="enquiryId"
              value={quotationForm.enquiryId}
              onChange={(e) => onSelectEnquiry(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg ${showQuotationErrors && isBlank(quotationForm.enquiryId) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            >
              <option value="">Select enquiry</option>
              {quotationEligibleEnquiries.map((enquiry) => (
                <option key={enquiry.enquiry_id} value={enquiry.enquiry_id}>
                  {enquiry.title}
                </option>
              ))}
            </select>
            {showQuotationErrors && isBlank(quotationForm.enquiryId) && (
              <p className="mt-1 text-xs text-rose-600">Enquiry is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Valid Till</label>
            <input
              type="date"
              name="validTill"
              value={quotationForm.validTill}
              onChange={onQuotationInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showQuotationErrors && isBlank(quotationForm.validTill) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showQuotationErrors && isBlank(quotationForm.validTill) && (
              <p className="mt-1 text-xs text-rose-600">Valid till date is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Delivery Date</label>
            <input
              type="date"
              name="expectedDeliveryDate"
              value={quotationForm.expectedDeliveryDate}
              onChange={onQuotationInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showQuotationErrors && isBlank(quotationForm.expectedDeliveryDate) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showQuotationErrors && isBlank(quotationForm.expectedDeliveryDate) && (
              <p className="mt-1 text-xs text-rose-600">Expected delivery date is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Advance Payment %</label>
            <input
              type="number"
              min="0"
              max="100"
              name="advancePaymentPercent"
              value={quotationForm.advancePaymentPercent}
              onChange={onQuotationInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showQuotationErrors && isNumberBlank(quotationForm.advancePaymentPercent) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showQuotationErrors && isNumberBlank(quotationForm.advancePaymentPercent) && (
              <p className="mt-1 text-xs text-rose-600">Advance payment percent is required.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
            <input
              name="notes"
              value={quotationForm.notes}
              onChange={onQuotationInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showQuotationErrors && isBlank(quotationForm.notes) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showQuotationErrors && isBlank(quotationForm.notes) && (
              <p className="mt-1 text-xs text-rose-600">Notes are required.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Items</label>
              <span className="text-xs text-slate-500">Items load from the enquiry.</span>
            </div>
            {quotationItems.length === 0 ? (
              <div className={`p-4 bg-slate-50 border rounded-lg text-sm ${showQuotationErrors ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-600'}`}>
                Select an enquiry to load items.
              </div>
            ) : (
              <div className="space-y-3">
                {quotationItems.map((item, index) => {
                  const totals = getItemTotals(item);
                  const component = componentLookup[item.componentId];
                  const componentName = item.name || component?.component_name || component?.name || 'Component';
                  const unitLabel = item.unit || component?.measurement_unit || component?.unit || '';
                  return (
                    <div key={`${item.componentId}-${index}`} className="grid grid-cols-1 md:grid-cols-8 gap-3 bg-white border border-slate-200 rounded-lg p-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Component</label>
                        <p className="text-sm font-semibold text-slate-900">{componentName}</p>
                        {unitLabel && <p className="text-xs text-slate-500">Unit: {unitLabel}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
                        <div className="w-full px-2 py-1.5 border rounded-md bg-slate-50 text-sm text-slate-700">
                          {item.quantity || 0}
                        </div>
                        {showQuotationErrors && isQuantityInvalid(item.quantity) && (
                          <p className="mt-1 text-xs text-rose-600">Qty is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => onQuotationItemChange(index, 'unitPrice', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showQuotationErrors && isNumberBlank(item.unitPrice) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showQuotationErrors && isNumberBlank(item.unitPrice) && (
                          <p className="mt-1 text-xs text-rose-600">Unit price is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.discountPercent}
                          onChange={(e) => onQuotationItemChange(index, 'discountPercent', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showQuotationErrors && isNumberBlank(item.discountPercent) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showQuotationErrors && isNumberBlank(item.discountPercent) && (
                          <p className="mt-1 text-xs text-rose-600">Discount is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">CGST %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.cgstPercent}
                          onChange={(e) => onQuotationItemChange(index, 'cgstPercent', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showQuotationErrors && isNumberBlank(item.cgstPercent) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showQuotationErrors && isNumberBlank(item.cgstPercent) && (
                          <p className="mt-1 text-xs text-rose-600">CGST is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">SGST %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.sgstPercent}
                          onChange={(e) => onQuotationItemChange(index, 'sgstPercent', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showQuotationErrors && isNumberBlank(item.sgstPercent) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showQuotationErrors && isNumberBlank(item.sgstPercent) && (
                          <p className="mt-1 text-xs text-rose-600">SGST is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Subtotal</label>
                        <div className="px-2 py-1.5 border rounded-md bg-slate-50 text-xs text-slate-700">
                          ₹{totals.subtotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="px-3 py-2 border rounded-md bg-slate-50 md:col-span-3">
                          Spec: {item.specifications || '—'}
                        </div>
                        <div className="px-3 py-2 border rounded-md bg-slate-50">
                          CGST: ₹{totals.cgstAmount.toFixed(2)}
                        </div>
                        <div className="px-3 py-2 border rounded-md bg-slate-50">
                          SGST: ₹{totals.sgstAmount.toFixed(2)}
                        </div>
                        <div className="px-3 py-2 border rounded-md bg-slate-100 font-semibold text-slate-900">
                          Total: ₹{totals.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {quotationItems.length > 0 && (
            <div className="md:col-span-2 bg-white border-2 border-slate-300 rounded-lg p-4 space-y-4">
              <h4 className="text-base font-semibold text-slate-900">Final Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-600">Total Base Price</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">₹{quotationFormTotals.baseSubtotal.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-md border border-slate-200 bg-amber-50">
                  <p className="text-xs font-semibold text-amber-700">Discount Applied ({quotationFormDiscountPercent.toFixed(2)}%)</p>
                  <p className="text-lg font-bold text-amber-900 mt-1">-₹{quotationFormTotals.discountAmount.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-md border border-slate-200 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-700">CGST Applied ({quotationFormCgstPercent.toFixed(2)}%)</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">₹{quotationFormTotals.cgstAmount.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-md border border-slate-200 bg-indigo-50">
                  <p className="text-xs font-semibold text-indigo-700">SGST Applied ({quotationFormSgstPercent.toFixed(2)}%)</p>
                  <p className="text-lg font-bold text-indigo-900 mt-1">₹{quotationFormTotals.sgstAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                <p className="text-sm font-semibold text-emerald-700">Total Price</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">₹{quotationFormTotals.grandTotal.toFixed(2)}</p>
              </div>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800">Send Quotation</button>
          </div>
          </form>
        </div>
      )}

      {activeTab === 'counter' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-2xl font-semibold text-slate-900">Negotiate Quotation</h3>
            <p className="text-sm text-slate-500">If requested by PM, submit a counter quotation.</p>
          </div>
          <form onSubmit={handleCounterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Quotation</label>
            <select
              name="quotationId"
              value={counterForm.quotationId}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && isBlank(counterForm.quotationId) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            >
              <option value="">Select quotation</option>
              {counterEligibleQuotations.map((quotation) => (
                <option key={quotation.quotation_id} value={quotation.quotation_id}>
                  {quotation.quotation_number}
                </option>
              ))}
            </select>
            {showCounterErrors && isBlank(counterForm.quotationId) && (
              <p className="mt-1 text-xs text-rose-600">Quotation is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Action</label>
            <select
              name="action"
              value={counterForm.action}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && isBlank(counterForm.action) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            >
              <option value="accept">Accept</option>
              <option value="reject">Reject</option>
              <option value="negotiate">Negotiate</option>
            </select>
            {showCounterErrors && isBlank(counterForm.action) && (
              <p className="mt-1 text-xs text-rose-600">Action is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Valid Till</label>
            <input
              type="date"
              name="validTill"
              value={counterForm.validTill}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && isBlank(counterForm.validTill) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showCounterErrors && isBlank(counterForm.validTill) && (
              <p className="mt-1 text-xs text-rose-600">Valid till date is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Delivery Date</label>
            <input
              type="date"
              name="expectedDeliveryDate"
              value={counterForm.expectedDeliveryDate}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && isBlank(counterForm.expectedDeliveryDate) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showCounterErrors && isBlank(counterForm.expectedDeliveryDate) && (
              <p className="mt-1 text-xs text-rose-600">Expected delivery date is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Advance Payment %</label>
            <input
              type="number"
              name="advancePaymentPercent"
              value={counterForm.advancePaymentPercent}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && isNumberBlank(counterForm.advancePaymentPercent) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showCounterErrors && isNumberBlank(counterForm.advancePaymentPercent) && (
              <p className="mt-1 text-xs text-rose-600">Advance payment percent is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Rejection Reason</label>
            <input
              name="rejectionReason"
              value={counterForm.rejectionReason}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && counterNeedsRejectionReason && isBlank(counterForm.rejectionReason) ? 'border-rose-500' : 'border-slate-300'}`}
              required={counterNeedsRejectionReason}
            />
            {showCounterErrors && counterNeedsRejectionReason && isBlank(counterForm.rejectionReason) && (
              <p className="mt-1 text-xs text-rose-600">Rejection reason is required.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Negotiation Notes</label>
            <textarea
              name="negotiationNotes"
              value={counterForm.negotiationNotes}
              onChange={onCounterInputChange}
              className={`w-full px-4 py-2 border rounded-lg ${showCounterErrors && counterNeedsNotes && isBlank(counterForm.negotiationNotes) ? 'border-rose-500' : 'border-slate-300'}`}
              rows="3"
              required={counterNeedsNotes}
            />
            {showCounterErrors && counterNeedsNotes && isBlank(counterForm.negotiationNotes) && (
              <p className="mt-1 text-xs text-rose-600">Negotiation notes are required.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Items (for negotiate)</label>
              <button
                type="button"
                onClick={onCounterItemAdd}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
              >
                Add Item
              </button>
            </div>
            {counterItems.length === 0 ? (
              <div className={`p-4 bg-slate-50 border rounded-lg text-sm ${showCounterErrors && counterNeedsItems ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-600'}`}>
                Add items when negotiating.
              </div>
            ) : (
              <div className="space-y-3">
                {counterItems.map((item, index) => {
                  const totals = getItemTotals(item);
                  const component = componentLookup[item.componentId];
                  const componentName = component?.component_name || component?.name || 'Component';
                  return (
                    <div key={`${item.componentId}-${index}`} className="grid grid-cols-1 md:grid-cols-8 gap-3 bg-white border border-slate-200 rounded-lg p-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Component</label>
                        <select
                          value={item.componentId}
                          onChange={(e) => onCounterItemChange(index, 'componentId', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showCounterErrors && isBlank(item.componentId) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        >
                          <option value="">Select component</option>
                          {componentCatalog.map((componentOption) => {
                            const componentId = componentOption.componentId || componentOption.componentid || componentOption.component_id || componentOption.id;
                            return (
                              <option key={componentId} value={componentId}>
                                {componentOption.component_name || componentOption.name}
                              </option>
                            );
                          })}
                        </select>
                        {showCounterErrors && isBlank(item.componentId) && (
                          <p className="mt-1 text-xs text-rose-600">Component is required.</p>
                        )}
                        {item.componentId && (
                          <p className="text-xs text-slate-500 mt-1">{componentName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => onCounterItemChange(index, 'quantity', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showCounterErrors && isQuantityInvalid(item.quantity) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showCounterErrors && isQuantityInvalid(item.quantity) && (
                          <p className="mt-1 text-xs text-rose-600">Qty is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => onCounterItemChange(index, 'unitPrice', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showCounterErrors && isNumberBlank(item.unitPrice) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showCounterErrors && isNumberBlank(item.unitPrice) && (
                          <p className="mt-1 text-xs text-rose-600">Unit price is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.discountPercent}
                          onChange={(e) => onCounterItemChange(index, 'discountPercent', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showCounterErrors && isNumberBlank(item.discountPercent) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showCounterErrors && isNumberBlank(item.discountPercent) && (
                          <p className="mt-1 text-xs text-rose-600">Discount is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">CGST %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.cgstPercent}
                          onChange={(e) => onCounterItemChange(index, 'cgstPercent', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showCounterErrors && isNumberBlank(item.cgstPercent) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showCounterErrors && isNumberBlank(item.cgstPercent) && (
                          <p className="mt-1 text-xs text-rose-600">CGST is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">SGST %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.sgstPercent}
                          onChange={(e) => onCounterItemChange(index, 'sgstPercent', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-md ${showCounterErrors && isNumberBlank(item.sgstPercent) ? 'border-rose-500' : 'border-slate-300'}`}
                          required
                        />
                        {showCounterErrors && isNumberBlank(item.sgstPercent) && (
                          <p className="mt-1 text-xs text-rose-600">SGST is required.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Subtotal</label>
                        <div className="px-2 py-1.5 border rounded-md bg-slate-50 text-xs text-slate-700">
                          ₹{totals.subtotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="px-3 py-2 border rounded-md bg-slate-50">
                          CGST: ₹{totals.cgstAmount.toFixed(2)}
                        </div>
                        <div className="px-3 py-2 border rounded-md bg-slate-50">
                          SGST: ₹{totals.sgstAmount.toFixed(2)}
                        </div>
                        <div className="px-3 py-2 border rounded-md bg-slate-100 font-semibold text-slate-900">
                          Total: ₹{totals.total.toFixed(2)}
                        </div>
                      </div>
                      <div className="md:col-span-8 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onCounterItemRemove(index)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800">Submit Negotiation</button>
          </div>
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
                  placeholder="Search quotations by number..."
                  value={quotationSearch}
                  onChange={(e) => setQuotationSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <select
                value={quotationStatus}
                onChange={(e) => setQuotationStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="negotiating">Negotiating</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Quotations</h3>
              <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredQuotations.length}</span>
            </div>
            {filteredQuotations.length === 0 ? (
              <p className="text-sm text-slate-500">No quotations yet.</p>
            ) : (
              <div className="space-y-3">
                {filteredQuotations.map((quotation) => (
                  <button
                    type="button"
                    key={quotation.quotation_id}
                    onClick={() => setSelectedQuotation(quotation)}
                    className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{quotation.quotation_number}</p>
                        <p className="text-xs text-slate-500">Valid till: {formatDate(quotation.valid_till)}</p>
                        <p className="text-xs text-slate-500 mt-1">{getQuotationNextStep(quotation.status)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                          {quotation.status || 'new'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(quotation.total_amount)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search counters by number or action..."
                  value={counterSearch}
                  onChange={(e) => setCounterSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <select
                value={counterStatus}
                onChange={(e) => setCounterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Counter Quotations</h3>
              <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredCounters.length}</span>
            </div>
            {filteredCounters.length === 0 ? (
              <p className="text-sm text-slate-500">No counter quotations yet.</p>
            ) : (
              <div className="space-y-3">
                {filteredCounters.map((counter) => (
                  <button
                    type="button"
                    key={counter.counter_id}
                    onClick={() => setSelectedCounter(counter)}
                    className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{counter.counter_number}</p>
                        <p className="text-xs text-slate-500">Action: {counter.action || '—'}</p>
                        <p className="text-xs text-slate-500 mt-1">{getCounterNextStep(counter.status)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(counter.status)}`}>
                          {counter.status || 'new'}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(counter.total_amount)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Quotation Details</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedQuotation.quotation_number}</h2>
                <p className="text-xs text-slate-500 mt-1">Valid till: {formatDate(selectedQuotation.valid_till)}</p>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
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
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedQuotation.status)}`}>
                    {selectedQuotation.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedQuotation.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Next Step</label>
                  <p className="text-sm text-slate-900">{getQuotationNextStep(selectedQuotation.status)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Line Items</h4>
                {selectedQuotation.items?.length ? (
                  <>
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
                          {selectedQuotation.items.map((item) => {
                            const component = componentLookup[item.component_id] || componentLookup[String(item.component_id)] || {};
                            const componentName = item.component_name || item.name || component.component_name || component.name || item.component_id || 'Component';
                            return (
                              <tr key={item.item_id} className="border-b border-slate-100">
                                <td className="py-2 text-slate-700">
                                  {componentName}
                                </td>
                                <td className="py-2 text-right text-slate-700">{item.quantity}</td>
                                <td className="py-2 text-right text-slate-700">₹{item.unit_price}</td>
                                <td className="py-2 text-right text-slate-700">{item.discount_percent || 0}%</td>
                                <td className="py-2 text-right text-slate-700">{item.cgst_percent || 0}%</td>
                                <td className="py-2 text-right text-slate-700">{item.sgst_percent || 0}%</td>
                                <td className="py-2 text-right font-semibold text-slate-900">₹{item.line_total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 bg-white border-2 border-slate-300 rounded-lg p-4 space-y-4">
                      <h4 className="text-base font-semibold text-slate-900">Final Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                          <p className="text-xs font-semibold text-slate-600">Total Base Price</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">₹{selectedQuotationTotals.baseSubtotal.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-md border border-slate-200 bg-amber-50">
                          <p className="text-xs font-semibold text-amber-700">Discount Applied ({selectedQuotationDiscountPercent.toFixed(2)}%)</p>
                          <p className="text-lg font-bold text-amber-900 mt-1">-₹{selectedQuotationTotals.discountAmount.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-md border border-slate-200 bg-blue-50">
                          <p className="text-xs font-semibold text-blue-700">CGST Applied ({selectedQuotationCgstPercent.toFixed(2)}%)</p>
                          <p className="text-lg font-bold text-blue-900 mt-1">₹{selectedQuotationTotals.cgstAmount.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-md border border-slate-200 bg-indigo-50">
                          <p className="text-xs font-semibold text-indigo-700">SGST Applied ({selectedQuotationSgstPercent.toFixed(2)}%)</p>
                          <p className="text-lg font-bold text-indigo-900 mt-1">₹{selectedQuotationTotals.sgstAmount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                        <p className="text-sm font-semibold text-emerald-700">Total Price</p>
                        <p className="text-2xl font-bold text-emerald-900 mt-1">₹{selectedQuotationTotals.grandTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No items available.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {onGoToLois && (
                <button
                  onClick={() => {
                    onGoToLois(selectedQuotation);
                    setSelectedQuotation(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  {hasLoi(selectedQuotation.quotation_id, null) ? 'View LOI' : 'View LOIs'}
                </button>
              )}
              {hasLoi(selectedQuotation.quotation_id, null) && (
                <span className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                  LOI Received ✓
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Counter Quotation</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedCounter.counter_number}</h2>
                <p className="text-xs text-slate-500 mt-1">Action: {selectedCounter.action || '—'}</p>
              </div>
              <button
                onClick={() => setSelectedCounter(null)}
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
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedCounter.status)}`}>
                    {selectedCounter.status || 'new'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedCounter.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Next Step</label>
                  <p className="text-sm text-slate-900">{getCounterNextStep(selectedCounter.status)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Line Items</h4>
                {selectedCounter.items?.length ? (
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
                        {selectedCounter.items.map((item) => {
                          const component = componentLookup[item.component_id] || componentLookup[String(item.component_id)] || {};
                          const componentName = item.component_name || item.name || component.component_name || component.name || item.component_id || 'Component';
                          return (
                          <tr key={item.item_id} className="border-b border-slate-100">
                            <td className="py-2 text-slate-700">{componentName}</td>
                            <td className="py-2 text-right text-slate-700">{item.quantity}</td>
                            <td className="py-2 text-right text-slate-700">₹{item.unit_price}</td>
                            <td className="py-2 text-right text-slate-700">{item.discount_percent || 0}%</td>
                            <td className="py-2 text-right text-slate-700">{item.cgst_percent || 0}%</td>
                            <td className="py-2 text-right text-slate-700">{item.sgst_percent || 0}%</td>
                            <td className="py-2 text-right font-semibold text-slate-900">₹{item.line_total}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No items available.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setSelectedCounter(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {onGoToLois && (
                <button
                  onClick={() => {
                    onGoToLois(selectedCounter);
                    setSelectedCounter(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  {hasLoi(selectedCounter.quotation_id, selectedCounter.counter_id) ? 'View LOI' : 'View LOIs'}
                </button>
              )}
              {hasLoi(selectedCounter.quotation_id, selectedCounter.counter_id) && (
                <span className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                  LOI Received ✓
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationsTab;
