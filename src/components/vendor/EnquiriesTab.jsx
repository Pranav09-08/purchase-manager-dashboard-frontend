import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

// Vendor enquiries list
function EnquiriesTab({ enquiries = [], componentCatalog = [], onCreateQuotation, getAuthHeaders, onRejectEnquiry, onEnquiryCreated, vendor }) {
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seenEnquiryIds, setSeenEnquiryIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vendorEnquirySeen') || '[]');
    } catch {
      return [];
    }
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    componentId: '',
    quantity: 1,
    unit: '',
    specifications: '',
    source: 'vendor_request',
    notes: '',
    requiredDeliveryDate: '',
  });
  const seenSet = new Set(seenEnquiryIds);
  const resolveEnquiryId = (enquiry) => enquiry.enquiry_id || enquiry.enquiryId || enquiry.id;
  const resolveEnquiryTitle = (enquiry) => (
    enquiry.title
    || enquiry.enquiry_title
    || enquiry.subject
    || `Enquiry ${resolveEnquiryId(enquiry) || ''}`
  );
  const resolveRequiredDeliveryDate = (enquiry) => (
    enquiry.required_delivery_date
    || enquiry.requiredDeliveryDate
    || enquiry.delivery_date
    || null
  );
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const resolveComponentId = (item) => item.component_id || item.componentId || item.componentid;
  const resolveEnquiryNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const resolveComponentName = (item, component) => (
    item.component_name
    || item.name
    || component?.component_name
    || component?.name
    || 'Component'
  );
  const resolveGst = (item, component, key) => (
    item[`${key}_percent`]
    ?? item[key]
    ?? item[`${key}Percent`]
    ?? component?.[key]
    ?? 0
  );
  const resolveDiscount = (item) => (
    Number(item.discount_percent || item.discount || item.discountPercent || 0) || 0
  );
  const componentLookup = componentCatalog.reduce((acc, component) => {
    const componentId = component.componentId || component.componentid || component.component_id || component.id;
    if (!componentId || acc[componentId]) return acc;
    acc[componentId] = component;
    acc[String(componentId)] = component;
    return acc;
  }, {});
  const getComponentFromLookup = (item) => {
    const componentId = resolveComponentId(item);
    if (!componentId) return {};
    return (
      componentLookup[componentId]
      || componentLookup[String(componentId)]
      || {}
    );
  };
  const getStatusLabel = (status) => {
    if (status === 'raised') return 'Raised';
    if (status === 'quoted') return 'Quoted';
    if (status === 'accepted') return 'Accepted';
    if (status === 'rejected') return 'Rejected';
    return status || 'New';
  };
  const getStatusColor = (status) => {
    if (status === 'raised') return 'bg-blue-100 text-blue-700';
    if (status === 'quoted') return 'bg-green-100 text-green-700';
    if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  const isPendingEnquiryStatus = (status) => ['raised', 'pending', 'new'].includes(status || 'new');
  const filteredEnquiries = enquiries.filter((enquiry) => {
    const title = (resolveEnquiryTitle(enquiry) || '').toLowerCase();
    const description = (enquiry.description || '').toLowerCase();
    const matchesSearch =
      title.includes(enquirySearch.toLowerCase()) ||
      description.includes(enquirySearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const unreadCount = filteredEnquiries.filter((enquiry) => !seenSet.has(resolveEnquiryId(enquiry))).length;
  const selectedEnquiryTotals = (selectedEnquiry?.items || []).reduce((acc, item) => {
    const component = getComponentFromLookup(item);

    const rawBasePrice = item.estimated_unit_cost
      ?? item.unit_price
      ?? item.unitPrice
      ?? component.price_per_unit
      ?? component.unit_price
      ?? component.cost_per_unit;
    const hasBasePrice = rawBasePrice !== null && rawBasePrice !== undefined && rawBasePrice !== '';
    const basePrice = hasBasePrice ? resolveEnquiryNumber(rawBasePrice, 0) : 0;

    const rawDiscount = item.discount_percent
      ?? item.discount
      ?? item.discountPercent
      ?? component.discount_percent
      ?? component.discountPercent
      ?? component.discount;
    const discount = rawDiscount !== null && rawDiscount !== undefined && rawDiscount !== ''
      ? resolveEnquiryNumber(rawDiscount, 0)
      : 0;

    const rawCgst = item.cgst
      ?? item.cgst_percent
      ?? item.cgstPercent
      ?? component.cgst
      ?? component.cgst_percent;
    const cgst = rawCgst !== null && rawCgst !== undefined && rawCgst !== ''
      ? resolveEnquiryNumber(rawCgst, 0)
      : 0;

    const rawSgst = item.sgst
      ?? item.sgst_percent
      ?? item.sgstPercent
      ?? component.sgst
      ?? component.sgst_percent;
    const sgst = rawSgst !== null && rawSgst !== undefined && rawSgst !== ''
      ? resolveEnquiryNumber(rawSgst, 0)
      : 0;

    const qty = resolveEnquiryNumber(item.quantity, 0);
    const baseSubtotal = hasBasePrice ? basePrice * qty : 0;
    const discountAmount = (baseSubtotal * discount) / 100;
    const taxableSubtotal = baseSubtotal - discountAmount;
    const cgstAmount = (taxableSubtotal * cgst) / 100;
    const sgstAmount = (taxableSubtotal * sgst) / 100;
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
  const selectedEnquiryDiscountPercent = selectedEnquiryTotals.baseSubtotal > 0
    ? (selectedEnquiryTotals.discountAmount / selectedEnquiryTotals.baseSubtotal) * 100
    : 0;
  const selectedEnquiryCgstPercent = selectedEnquiryTotals.taxableSubtotal > 0
    ? (selectedEnquiryTotals.cgstAmount / selectedEnquiryTotals.taxableSubtotal) * 100
    : 0;
  const selectedEnquirySgstPercent = selectedEnquiryTotals.taxableSubtotal > 0
    ? (selectedEnquiryTotals.sgstAmount / selectedEnquiryTotals.taxableSubtotal) * 100
    : 0;
  useEffect(() => {
    if (!selectedEnquiry) return;
    const loggedItems = (selectedEnquiry.items || []).map((item) => ({
      item_id: item.item_id,
      enquiry_id: item.enquiry_id,
      component_id: item.component_id || item.componentId || item.componentid || null,
      component_name: item.component_name || item.name || null,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      specifications: item.specifications || item.specification || null,
      estimated_unit_cost: item.estimated_unit_cost ?? item.unit_price ?? item.unitPrice ?? null,
      discount_percent: item.discount_percent ?? item.discount ?? item.discountPercent ?? null,
      cgst: item.cgst ?? item.cgst_percent ?? item.cgstPercent ?? null,
      sgst: item.sgst ?? item.sgst_percent ?? item.sgstPercent ?? null,
      created_at: item.created_at || null,
    }));
    console.log('Vendor enquiry details', {
      enquiry: selectedEnquiry,
      items: loggedItems,
    });
  }, [selectedEnquiry]);
  const markEnquirySeen = (enquiryId) => {
    if (!enquiryId || seenSet.has(enquiryId)) return;
    const next = [...seenEnquiryIds, enquiryId];
    setSeenEnquiryIds(next);
    localStorage.setItem('vendorEnquirySeen', JSON.stringify(next));
  };
  const handleRejectEnquiry = async () => {
    if (!selectedEnquiry || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setRejectLoading(true);
    try {
      const { data } = await apiClient.patch(
        `/purchase-enquiry/${resolveEnquiryId(selectedEnquiry)}/reject`,
        { rejectionReason: rejectionReason.trim() }
      );
      
      // Call parent callback if provided
      if (onRejectEnquiry) {
        onRejectEnquiry(data.enquiry);
      }
      
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedEnquiry(null);
      alert('Enquiry rejected successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error rejecting enquiry');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleAcceptEnquiry = async () => {
    if (!selectedEnquiry) return;
    setAcceptLoading(true);
    try {
      const { data } = await apiClient.patch(
        `/purchase-enquiry/${resolveEnquiryId(selectedEnquiry)}`,
        { status: 'accepted' }
      );

      if (onEnquiryCreated) {
        onEnquiryCreated(data.enquiry);
      }

      setSelectedEnquiry((prev) => prev ? { ...prev, status: 'accepted' } : prev);
      alert('Enquiry accepted successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error accepting enquiry');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleCreateSalesEnquiry = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      alert('Please enter title');
      return;
    }
    if (!createForm.componentId) {
      alert('Please select a component');
      return;
    }
    if (Number(createForm.quantity) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    setCreateLoading(true);
    try {
      const selectedComponent = componentCatalog.find((component) => {
        const id = component.componentid || component.component_id || component.id;
        return String(id) === String(createForm.componentId);
      });
      const componentName = selectedComponent?.component_name || selectedComponent?.name || 'Component';
      const fallbackUnit = selectedComponent?.unit_of_measurement || selectedComponent?.measurement_unit || selectedComponent?.unit || null;

      const payload = {
        companyId: vendor?.vendor_id || vendor?.companyId || null,
        vendorId: vendor?.vendor_id || null,
        title: createForm.title.trim() || `${componentName} Enquiry`,
        description: createForm.description?.trim() || createForm.specifications?.trim() || null,
        notes: createForm.notes?.trim() || null,
        requiredDeliveryDate: createForm.requiredDeliveryDate || null,
        source: createForm.source || 'vendor_request',
        items: [
          {
            componentId: createForm.componentId,
            quantity: Number(createForm.quantity),
            unit: createForm.unit?.trim() || fallbackUnit,
            specifications: createForm.specifications?.trim() || null,
          },
        ],
      };

      const { data } = await apiClient.post('/purchase-enquiry', payload);

      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        componentId: '',
        quantity: 1,
        unit: '',
        specifications: '',
        source: 'vendor_request',
        notes: '',
        requiredDeliveryDate: '',
      });
      if (onEnquiryCreated) {
        onEnquiryCreated(data.enquiry);
      }
      alert('Enquiry created successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to create enquiry');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">Purchase Enquiries</h2>
          <p className="text-sm text-slate-500">
            Review enquiries sent by the purchase manager.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
        >
          Create Enquiry for Sales Manager
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search enquiries by title or description..."
              value={enquirySearch}
              onChange={(e) => setEnquirySearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="all">All Enquiries</option>
            <option value="raised">Raised</option>
            <option value="accepted">Accepted</option>
            <option value="quoted">Quoted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Enquiries</h3>
          <span className="text-xs font-semibold text-slate-500 uppercase">Total: {filteredEnquiries.length}</span>
        </div>
        {filteredEnquiries.length === 0 ? (
          <p className="text-sm text-slate-500">No enquiries yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredEnquiries.map((enquiry) => (
              <button
                type="button"
                key={resolveEnquiryId(enquiry)}
                onClick={() => {
                  markEnquirySeen(resolveEnquiryId(enquiry));
                  setSelectedEnquiry(enquiry);
                }}
                className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {resolveEnquiryTitle(enquiry)}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {enquiry.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!seenSet.has(resolveEnquiryId(enquiry)) && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                        Unread
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(enquiry.status)}`}>
                      {getStatusLabel(enquiry.status)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Required: {formatDate(resolveRequiredDeliveryDate(enquiry))}</span>
                  <span>Created: {formatDate(enquiry.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">Enquiry Details</h2>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {resolveEnquiryTitle(selectedEnquiry)}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">ID: {resolveEnquiryId(selectedEnquiry) || '—'}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(selectedEnquiry.status)}`}>
                    {getStatusLabel(selectedEnquiry.status)}
                  </span>
                </div>

                {selectedEnquiry.description && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                      {selectedEnquiry.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Required Delivery Date</label>
                    <p className="text-sm text-slate-900">{formatDate(resolveRequiredDeliveryDate(selectedEnquiry))}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Source</label>
                    <p className="text-sm text-slate-900 capitalize">{selectedEnquiry.source || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Created Date</label>
                    <p className="text-sm text-slate-900">{formatDate(selectedEnquiry.created_at)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Line Items</h4>
                  {selectedEnquiry.items?.length ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full min-w-[1000px] text-sm">
                          <thead className="text-xs uppercase text-slate-500">
                            <tr className="border-b border-slate-200">
                              <th className="py-2 text-left font-semibold">Component</th>
                              <th className="py-2 text-left font-semibold">Specifications</th>
                              <th className="py-2 text-right font-semibold">Qty</th>
                              <th className="py-2 text-right font-semibold">Unit</th>
                              <th className="py-2 text-right font-semibold">Base Price</th>
                              <th className="py-2 text-right font-semibold">Disc %</th>
                              <th className="py-2 text-right font-semibold">CGST %</th>
                              <th className="py-2 text-right font-semibold">SGST %</th>
                              <th className="py-2 text-right font-semibold">Final Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEnquiry.items.map((item) => {
                            const component = getComponentFromLookup(item);
                            const resolvedUnit = item.unit
                              || component.unit_of_measurement
                              || component.measurement_unit
                              || component.unit
                              || null;
                            const hasUnit = resolvedUnit !== null && resolvedUnit !== undefined && String(resolvedUnit).trim() !== '';
                            const rawBasePrice = item.estimated_unit_cost
                              ?? item.unit_price
                              ?? item.unitPrice
                              ?? component.price_per_unit
                              ?? component.unit_price
                              ?? component.cost_per_unit;
                            const hasBasePrice = rawBasePrice !== null && rawBasePrice !== undefined && rawBasePrice !== '';
                            const basePrice = hasBasePrice ? resolveEnquiryNumber(rawBasePrice, 0) : null;
                            const rawDiscount = item.discount_percent
                              ?? item.discount
                              ?? item.discountPercent
                              ?? component.discount_percent
                              ?? component.discountPercent
                              ?? component.discount;
                            const hasDiscount = rawDiscount !== null && rawDiscount !== undefined && rawDiscount !== '';
                            const discount = hasDiscount ? resolveEnquiryNumber(rawDiscount, 0) : 0;
                            const rawCgst = item.cgst
                              ?? item.cgst_percent
                              ?? item.cgstPercent
                              ?? component.cgst
                              ?? component.cgst_percent;
                            const hasCgst = rawCgst !== null && rawCgst !== undefined && rawCgst !== '';
                            const cgst = hasCgst ? resolveEnquiryNumber(rawCgst, 0) : 0;
                            const rawSgst = item.sgst
                              ?? item.sgst_percent
                              ?? item.sgstPercent
                              ?? component.sgst
                              ?? component.sgst_percent;
                            const hasSgst = rawSgst !== null && rawSgst !== undefined && rawSgst !== '';
                            const sgst = hasSgst ? resolveEnquiryNumber(rawSgst, 0) : 0;
                            const specifications = item.specifications || item.specification || '—';
                            const discountedPrice = hasBasePrice ? basePrice - ((basePrice * discount) / 100) : 0;
                            const totalTaxPercent = Number(cgst) + Number(sgst);
                            const finalPrice = hasBasePrice ? discountedPrice + ((discountedPrice * totalTaxPercent) / 100) : 0;
                            const qty = resolveEnquiryNumber(item.quantity, 0);
                            const baseSubtotal = hasBasePrice ? basePrice * qty : 0;
                            const discountAmount = (baseSubtotal * discount) / 100;
                            const taxableSubtotal = baseSubtotal - discountAmount;
                            const cgstAmount = (taxableSubtotal * cgst) / 100;
                            const sgstAmount = (taxableSubtotal * sgst) / 100;
                            const total = hasBasePrice ? finalPrice * qty : null;
                            return (
                              <tr key={item.item_id || resolveComponentId(item)} className="border-b border-slate-100">
                                <td className="py-2 text-slate-700">{resolveComponentName(item, component)}</td>
                                <td className="py-2 text-slate-700">{specifications}</td>
                                <td className="py-2 text-right text-slate-700">{qty}</td>
                                <td className="py-2 text-right text-slate-700">
                                  {hasUnit ? resolvedUnit : '—'}
                                </td>
                                <td className="py-2 text-right text-slate-700">{hasBasePrice ? `₹${basePrice.toFixed(2)}` : '—'}</td>
                                <td className="py-2 text-right text-slate-700">
                                  <div className="flex flex-col items-end">
                                    <span>{hasDiscount ? `${discount}%` : '—'}</span>
                                    <span className="text-[11px] font-semibold text-amber-700">{hasBasePrice ? `₹${discountAmount.toFixed(2)}` : '—'}</span>
                                  </div>
                                </td>
                                <td className="py-2 text-right text-slate-700">
                                  <div className="flex flex-col items-end">
                                    <span>{hasCgst ? `${cgst}%` : '—'}</span>
                                    <span className="text-[11px] font-semibold text-blue-700">{hasBasePrice ? `₹${cgstAmount.toFixed(2)}` : '—'}</span>
                                  </div>
                                </td>
                                <td className="py-2 text-right text-slate-700">
                                  <div className="flex flex-col items-end">
                                    <span>{hasSgst ? `${sgst}%` : '—'}</span>
                                    <span className="text-[11px] font-semibold text-indigo-700">{hasBasePrice ? `₹${sgstAmount.toFixed(2)}` : '—'}</span>
                                  </div>
                                </td>
                                <td className="py-2 text-right font-semibold text-emerald-700">{total !== null ? `₹${total.toFixed(2)}` : '—'}</td>
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
                            <p className="text-lg font-bold text-slate-900 mt-1">₹{selectedEnquiryTotals.baseSubtotal.toFixed(2)}</p>
                          </div>
                          <div className="p-3 rounded-md border border-slate-200 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-700">Discount Applied ({selectedEnquiryDiscountPercent.toFixed(2)}%)</p>
                            <p className="text-lg font-bold text-amber-900 mt-1">-₹{selectedEnquiryTotals.discountAmount.toFixed(2)}</p>
                          </div>
                          <div className="p-3 rounded-md border border-slate-200 bg-blue-50">
                            <p className="text-xs font-semibold text-blue-700">CGST Applied ({selectedEnquiryCgstPercent.toFixed(2)}%)</p>
                            <p className="text-lg font-bold text-blue-900 mt-1">₹{selectedEnquiryTotals.cgstAmount.toFixed(2)}</p>
                          </div>
                          <div className="p-3 rounded-md border border-slate-200 bg-indigo-50">
                            <p className="text-xs font-semibold text-indigo-700">SGST Applied ({selectedEnquirySgstPercent.toFixed(2)}%)</p>
                            <p className="text-lg font-bold text-indigo-900 mt-1">₹{selectedEnquiryTotals.sgstAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                          <p className="text-sm font-semibold text-emerald-700">Total Price</p>
                          <p className="text-2xl font-bold text-emerald-900 mt-1">₹{selectedEnquiryTotals.grandTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">No line items.</p>
                  )}
                </div>
              </div>
              
              {selectedEnquiry.status === 'rejected' && selectedEnquiry.rejection_reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-rose-900 mb-2">Rejection Reason:</p>
                  <p className="text-sm text-rose-800">{selectedEnquiry.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 flex-wrap">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {isPendingEnquiryStatus(selectedEnquiry.status) && (
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition"
                >
                  Reject
                </button>
              )}
              {isPendingEnquiryStatus(selectedEnquiry.status) && (
                <button
                  onClick={handleAcceptEnquiry}
                  disabled={acceptLoading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acceptLoading ? 'Accepting...' : 'Accept Enquiry'}
                </button>
              )}
              {selectedEnquiry.status === 'accepted' && (
                <button
                  onClick={() => {
                    if (onCreateQuotation) onCreateQuotation(selectedEnquiry);
                    setSelectedEnquiry(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  Create Quotation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Reject Enquiry</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why you cannot fulfill this enquiry (e.g., components not available, specifications not supported, etc.)"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                rows="4"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectEnquiry}
                disabled={!rejectionReason.trim() || rejectLoading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Enquiry for Sales Manager</h2>

            <form onSubmit={handleCreateSalesEnquiry} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Enter enquiry title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="Describe enquiry details"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Component</label>
                  <select
                    value={createForm.componentId}
                    onChange={(e) => {
                      const nextComponentId = e.target.value;
                      const selectedComponent = componentCatalog.find((component) => {
                        const id = component.componentid || component.component_id || component.id;
                        return String(id) === String(nextComponentId);
                      });
                      const defaultUnit = selectedComponent?.unit_of_measurement || selectedComponent?.measurement_unit || selectedComponent?.unit || '';
                      setCreateForm((prev) => ({ ...prev, componentId: nextComponentId, unit: prev.unit || defaultUnit }));
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select component</option>
                    {componentCatalog.map((component) => {
                      const id = component.componentid || component.component_id || component.id;
                      const name = component.component_name || component.name || 'Component';
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={createForm.unit}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="e.g. pcs, kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Specifications</label>
                  <input
                    type="text"
                    value={createForm.specifications}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, specifications: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Optional requirements"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Source</label>
                  <select
                    value={createForm.source}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, source: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="vendor_request">Vendor Request</option>
                    <option value="urgent">Urgent</option>
                    <option value="planning">Planning</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <input
                    type="text"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Required Delivery Date</label>
                <input
                  type="date"
                  value={createForm.requiredDeliveryDate}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, requiredDeliveryDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {createLoading ? 'Sending...' : 'Send Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnquiriesTab;
