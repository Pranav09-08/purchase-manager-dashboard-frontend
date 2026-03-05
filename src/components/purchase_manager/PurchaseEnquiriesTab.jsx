import { useEffect, useState } from 'react';

// Purchase enquiries (RFQ) list and create form
function PurchaseEnquiriesTab({
  enquiries,
  quotations = [],
  lois = [],
  components,
  vendors = [],
    vendorComponents = [],
  selectedItems,
  formData,
  onInputChange,
  onAddItem,
  onRemoveItem,
  onItemChange,
  onSubmit,
  onEditEnquiry,
  editingEnquiryId,
  onCancelEdit,
  onDeleteEnquiry,
  componentLookup = {},
  componentDetailsLookup = {},
  productLookup = {},
  onAcceptQuotation,
  onRejectQuotation,
  onGoToLois,
}) {
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [quotationEnquiry, setQuotationEnquiry] = useState(null);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedQuotationDetail, setSelectedQuotationDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showErrors, setShowErrors] = useState(false);
  // Reset error flags when form is cleared (after successful submission)
  useEffect(() => {
    // If all key fields are empty, form was just cleared - reset errors
    const isCleared = !formData.vendorId && !formData.title && !formData.requiredDeliveryDate;
    if (isCleared && showErrors) {
      setShowErrors(false);
    }
  }, [formData, showErrors]);
  const getEnquiryTitle = (enquiry) => (
    enquiry.title
    || enquiry.enquiry_title
    || enquiry.subject
    || `Enquiry ${enquiry.enquiry_id || enquiry.enquiryId || enquiry.id || ''}`
  );
  const resolveEnquiryId = (enquiry) => enquiry.enquiry_id || enquiry.enquiryId || enquiry.id;
  const resolveRequiredDeliveryDate = (enquiry) => (
    enquiry.required_delivery_date
    || enquiry.requiredDeliveryDate
    || enquiry.delivery_date
    || null
  );
  const resolveComponentId = (item) => item.component_id || item.componentId || item.componentid;
  const resolveProductName = (item, component) => {
    const directName = (
      item.product_name
      || item.product_title
      || item.productTitle
      || item.product
      || component?.product_name
      || component?.productTitle
    );
    if (directName) return directName;

    const productId = component?.productId || component?.productid;
    if (productId && productLookup[productId]) return productLookup[productId];

    return component?.product_name || component?.component_name || '—';
  };
  const resolveComponentName = (item, component) => {
    // Try to get name from item first (multiple field variations)
    const itemName = (
      item.component_name
      || item.componentName
      || item.name
      || item.component_title
      || item.componentTitle
    );
    if (itemName) return itemName;

    // Try to get from component object
    const componentName = (
      component?.component_name
      || component?.componentName
      || component?.name
      || component?.component_title
      || component?.title
    );
    if (componentName) return componentName;

    // Fall back to component ID if name not available
    const componentId = item.component_id || item.componentId || item.componentid;
    if (componentId) return `Component ${componentId}`;

    return '—';
  };
  const resolveGst = (item, component, key) => (
    item[`${key}_percent`]
    ?? item[key]
    ?? item[`${key}Percent`]
    ?? component?.[key]
    ?? 0
  );
  const resolveQuotationEnquiryId = (quotation) => quotation.enquiry_id || quotation.enquiryId;
  const resolveNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
  const vendorLookup = vendors.reduce((acc, vendor) => {
    acc[vendor.vendorId] = vendor.label;
    return acc;
  }, {});
  const selectedVendorId = formData.vendorId;
  const selectedVendorInfo = vendors.find(v => v.vendorId === selectedVendorId);
  // Show all components available - not filtered by vendor since product components don't have vendor_id
  
    // Helper to convert date to yyyy-mm-dd format for input
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

  const getComponentId = (component) => (
    component?.componentId || component?.componentid || component?.component_id || component?.id
  );
  const getComponentVendorId = (component) => (
    component?.vendor_id || component?.vendorId || component?.vendorid || component?.company_id || component?.companyId
  );
  const getComponentName = (component) => (
    component?.component_name || component?.componentName || component?.name || ''
  );
  const getComponentByItem = (item) => {
    const itemId = item?.componentId || item?.component_id || item?.componentid;
    const itemName = item?.component_name || item?.name;
    return componentSource.find((component) => {
      const componentId = getComponentId(component);
      const componentName = getComponentName(component);
      return (
        (itemId && String(componentId) === String(itemId))
        || (itemName && String(componentName).trim().toLowerCase() === String(itemName).trim().toLowerCase())
      );
    });
  };
  const getMinimumOrder = (component) => {
    const raw = component?.minimum_order
      ?? component?.minimum_order_quantity
      ?? component?.minimum_order_qty
      ?? component?.min_order_quantity
      ?? component?.min_quantity
      ?? component?.minimumQuantity
      ?? component?.minimumOrder
      ?? component?.minimum_qty;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };
  const getStockAvailable = (component) => {
    const raw = component?.stock_available
      ?? component?.current_stock
      ?? component?.available_quantity
      ?? component?.availableQuantity
      ?? component?.stock
      ?? component?.stockAvailable;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };

  // Filter components by selected vendor (prefer vendorComponents, fallback to components)
  const componentSource = Array.isArray(vendorComponents) && vendorComponents.length > 0
    ? vendorComponents
    : components;
  const filteredComponents = selectedVendorId
    ? componentSource.filter((component) => String(getComponentVendorId(component)) === String(selectedVendorId))
    : [];
  const getStatusLabel = (status) => {
    if (status === 'quoted') return 'Quoted';
    if (status === 'accepted') return 'Accepted';
    if (status === 'rejected') return 'Rejected by Vendor';
    if (status === 'raised' || status === 'pending' || status === 'new') return 'Pending';
    return 'Pending';
  };
  const getStatusColor = (status) => {
    if (status === 'quoted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'accepted') return 'bg-blue-100 text-blue-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    if (status === 'raised' || status === 'pending' || status === 'new') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };
  const getQuotationStatusLabel = (status) => {
    if (status === 'sent') return 'Sent';
    if (status === 'negotiating') return 'Negotiating';
    if (status === 'accepted') return 'Accepted';
    if (status === 'rejected') return 'Rejected';
    return status || 'New';
  };
  const getQuotationStatusColor = (status) => {
    if (status === 'sent') return 'bg-blue-100 text-blue-700';
    if (status === 'negotiating') return 'bg-amber-100 text-amber-700';
    if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };
  
  // Check if LOI already exists for quotation
  const hasLoi = (quotationId) => {
    return lois.some((loi) => {
      const loiQuotationId = loi.quotation_id || loi.quotationId;
      return String(loiQuotationId) === String(quotationId);
    });
  };
  
  const filteredEnquiries = enquiries.filter((enquiry) => {
    const title = (getEnquiryTitle(enquiry) || '').toLowerCase();
    const description = (enquiry.description || '').toLowerCase();
    const matchesSearch =
      title.includes(enquirySearch.toLowerCase()) ||
      description.includes(enquirySearch.toLowerCase());
    const status = enquiry.status || 'pending';
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'pending' && ['raised', 'pending', 'new'].includes(status))
      || (statusFilter === 'quoted' && status === 'quoted')
      || (statusFilter === 'rejected' && status === 'rejected');
    return matchesSearch && matchesStatus;
  });
  const selectedEnquiryId = quotationEnquiry?.enquiry_id || quotationEnquiry?.enquiryId || '';
  const enquiryQuotations = selectedEnquiryId
    ? quotations.filter((quotation) => String(resolveQuotationEnquiryId(quotation)) === String(selectedEnquiryId))
    : [];
  const selectedEnquiryHasQuotations = selectedEnquiry
    ? quotations.some((quotation) => String(resolveQuotationEnquiryId(quotation)) === String(resolveEnquiryId(selectedEnquiry)))
    : false;
  const canEditSelectedEnquiry = Boolean(
    selectedEnquiry
    && onEditEnquiry
    && ['pending', 'raised', 'new'].includes(selectedEnquiry.status || 'pending')
    && !selectedEnquiryHasQuotations
  );
  const isBlank = (value) => !String(value ?? '').trim();
  const isQuantityInvalid = (value, component) => {
    const qty = Number(value);
    if (qty <= 0) return true;
    const minQty = getMinimumOrder(component);
    if (minQty > 0 && qty < minQty) return true;
    const availQty = getStockAvailable(component);
    if (availQty !== null && qty > availQty) return true;
    return false;
  };
  const getQuantityError = (value, component) => {
    const qty = Number(value);
    if (qty <= 0) return 'Quantity must be greater than 0';
    const minQty = getMinimumOrder(component);
    if (minQty > 0 && qty < minQty) return `Minimum quantity is ${minQty}`;
    const availQty = getStockAvailable(component);
    if (availQty !== null && qty > availQty) return `Stock available is ${availQty}`;
    return '';
  };
  const hasItemErrors = selectedItems.some((item) => {
    const component = getComponentByItem(item);
    const componentId = item.component_id || item.componentId || item.componentid;
    const componentDetails = componentDetailsLookup[componentId] || componentDetailsLookup[String(componentId)];
    const quantitySource = { ...(componentDetails || {}), ...(component || {}), ...(item || {}) };
    return isQuantityInvalid(item.quantity, quantitySource);
  });
  const hasErrors = (
    isBlank(formData.vendorId)
    || isBlank(formData.title)
    || isBlank(formData.description)
    || isBlank(formData.requiredDeliveryDate)
    || isBlank(formData.source)
    || selectedItems.length === 0
    || hasItemErrors
  );
  const selectedItemsTotals = selectedItems.reduce((acc, item) => {
    const quantity = Number(item.quantity || 0);
    // Try to get unit cost from item first, then from componentDetailsLookup
    const componentId = item.component_id || item.componentId || item.componentid;
    const componentDetails = componentDetailsLookup[componentId] || componentDetailsLookup[String(componentId)];
    const itemPrice = item.estimated_unit_cost || item.unitCost || item.unit_price;
    const unitCost = Number(itemPrice || componentDetails?.price_per_unit || componentDetails?.unit_price || 0);
    // Use component's tax/discount values (non-editable)
    const discountPercent = Number(componentDetails?.discount_percent || componentDetails?.discount || 0);
    const cgstPercent = Number(componentDetails?.cgst_percent || componentDetails?.cgst || 0);
    const sgstPercent = Number(componentDetails?.sgst_percent || componentDetails?.sgst || 0);

    const baseSubtotal = unitCost * quantity;
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
  const effectiveDiscountPercent = selectedItemsTotals.baseSubtotal > 0
    ? (selectedItemsTotals.discountAmount / selectedItemsTotals.baseSubtotal) * 100
    : 0;
  const effectiveCgstPercent = selectedItemsTotals.taxableSubtotal > 0
    ? (selectedItemsTotals.cgstAmount / selectedItemsTotals.taxableSubtotal) * 100
    : 0;
  const effectiveSgstPercent = selectedItemsTotals.taxableSubtotal > 0
    ? (selectedItemsTotals.sgstAmount / selectedItemsTotals.taxableSubtotal) * 100
    : 0;
  const selectedEnquiryTotals = (selectedEnquiry?.items || []).reduce((acc, item) => {
    const componentId = resolveComponentId(item);
    const component = (
      componentDetailsLookup[componentId]
      || componentDetailsLookup[String(componentId)]
      || {}
    );

    const rawBasePrice = item.estimated_unit_cost
      ?? item.unit_price
      ?? item.unitPrice
      ?? component.price_per_unit
      ?? component.unit_price
      ?? component.cost_per_unit;
    const hasBasePrice = rawBasePrice !== null && rawBasePrice !== undefined && rawBasePrice !== '';
    const basePrice = hasBasePrice ? resolveNumber(rawBasePrice, 0) : 0;

    const rawDiscount = item.discount_percent
      ?? item.discount
      ?? item.discountPercent
      ?? component.discount_percent
      ?? component.discountPercent
      ?? component.discount;
    const discount = rawDiscount !== null && rawDiscount !== undefined && rawDiscount !== ''
      ? resolveNumber(rawDiscount, 0)
      : 0;

    const rawCgst = item.cgst
      ?? item.cgst_percent
      ?? item.cgstPercent
      ?? component.cgst
      ?? component.cgst_percent;
    const cgst = rawCgst !== null && rawCgst !== undefined && rawCgst !== ''
      ? resolveNumber(rawCgst, 0)
      : 0;

    const rawSgst = item.sgst
      ?? item.sgst_percent
      ?? item.sgstPercent
      ?? component.sgst
      ?? component.sgst_percent;
    const sgst = rawSgst !== null && rawSgst !== undefined && rawSgst !== ''
      ? resolveNumber(rawSgst, 0)
      : 0;

    const qty = resolveNumber(item.quantity, 0);
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
  const handleSubmit = (e) => {
    setShowErrors(true);
    if (hasErrors) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
  };

  useEffect(() => {
    if (editingEnquiryId) {
      setActiveTab('create');
    }
  }, [editingEnquiryId]);

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
    console.log('PM enquiry details', {
      enquiry: selectedEnquiry,
      items: loggedItems,
    });
  }, [selectedEnquiry]);

  const handleResubmitEnquiry = (enquiry) => {
    // Load the enquiry for editing with fresh status (resubmit)
    onEditEnquiry(enquiry);
    setActiveTab('create');
    setSelectedEnquiry(null);
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
            All Enquiries
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
            Create Enquiry
          </button>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-base font-semibold text-white shadow hover:bg-slate-700"
        >
          + Create New Enquiry
        </button>
      </div>

      {activeTab === 'create' && (
        <div>
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">{editingEnquiryId ? 'Edit Enquiry' : 'Raise Enquiry'}</h2>
            <p className="text-sm text-slate-500">
              {editingEnquiryId ? 'Update enquiry details before it is quoted.' : 'Choose a vendor and submit your requirements.'}
            </p>
          </div>
          
          {formData._previousRejectionReason && (
            <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-rose-900 mb-2">Previous Vendor Rejection:</p>
              <p className="text-sm text-rose-800">{formData._previousRejectionReason}</p>
              <p className="text-xs text-rose-700 mt-2 italic">Please address the concerns mentioned above before resubmitting.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Enquiry Details</h3>
              <p className="text-sm text-slate-500">Send an RFQ to a vendor.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Vendor</label>
            <select
              name="vendorId"
              value={formData.vendorId}
              onChange={onInputChange}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-sm ${showErrors && isBlank(formData.vendorId) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            >
              <option value="">Choose a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.vendorId} value={vendor.vendorId}>
                  {vendor.label}
                </option>
              ))}
            </select>
            {showErrors && isBlank(formData.vendorId) && (
              <p className="mt-1 text-xs text-rose-600">Vendor is required.</p>
            )}
            {selectedVendorInfo && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-2">Vendor Details:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-600">Company:</span>
                    <span className="ml-1 text-slate-900">{selectedVendorInfo.companyName || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Contact:</span>
                    <span className="ml-1 text-slate-900">{selectedVendorInfo.contactPerson || '—'}</span>
                  </div>
                  {selectedVendorInfo.contactEmail && (
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-600">Email:</span>
                      <span className="ml-1 text-slate-900">{selectedVendorInfo.contactEmail}</span>
                    </div>
                  )}
                  {selectedVendorInfo.contactPhone && (
                    <div>
                      <span className="font-semibold text-slate-600">Phone:</span>
                      <span className="ml-1 text-slate-900">{selectedVendorInfo.contactPhone}</span>
                    </div>
                  )}
                  {selectedVendorInfo.businessType && (
                    <div>
                      <span className="font-semibold text-slate-600">Type:</span>
                      <span className="ml-1 text-slate-900">{selectedVendorInfo.businessType}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Available Components:</span>
                    <span className="ml-1 text-slate-900">{filteredComponents.length}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-sm ${showErrors && isBlank(formData.title) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showErrors && isBlank(formData.title) && (
              <p className="mt-1 text-xs text-rose-600">Title is required.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onInputChange}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-sm ${showErrors && isBlank(formData.description) ? 'border-rose-500' : 'border-slate-300'}`}
              rows="3"
              required
            />
            {showErrors && isBlank(formData.description) && (
              <p className="mt-1 text-xs text-rose-600">Description is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Required Delivery Date</label>
            <input
              type="date"
              name="requiredDeliveryDate"
                value={formatDateForInput(formData.requiredDeliveryDate)}
              onChange={onInputChange}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-sm ${showErrors && isBlank(formData.requiredDeliveryDate) ? 'border-rose-500' : 'border-slate-300'}`}
              required
            />
            {showErrors && isBlank(formData.requiredDeliveryDate) && (
              <p className="mt-1 text-xs text-rose-600">Delivery date is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Source</label>
            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={onInputChange}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-sm ${showErrors && isBlank(formData.source) ? 'border-rose-500' : 'border-slate-300'}`}
              placeholder="emergency"
              required
            />
            {showErrors && isBlank(formData.source) && (
              <p className="mt-1 text-xs text-rose-600">Source is required.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Components</label>
            {filteredComponents.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                No components available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredComponents.map((component) => {
                  const componentId = getComponentId(component);
                  const componentName = component.component_name || component.name;
                  const componentDescription = component.description || '—';
                  const isSelected = selectedItems.some((item) => item.componentId === componentId);
                  return (
                    <div key={componentId} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{componentName}</p>
                          <p className="text-xs text-slate-500">{componentDescription}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddItem(component)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${isSelected ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'}`}
                          disabled={isSelected}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Selected Items</label>
            {selectedItems.length === 0 ? (
              <div className={`p-4 bg-slate-50 border rounded-lg text-sm ${showErrors ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-600'}`}>
                Select at least one component.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedItems.map((item) => {
                  const component = getComponentByItem(item);
                  const componentDescription = component?.description || '';
                  const quantity = Number(item.quantity || 0);
                  // Try to get unit cost from item first, then from componentDetailsLookup, otherwise default to component price
                  const componentId = item.component_id || item.componentId || item.componentid;
                  const componentDetails = componentDetailsLookup[componentId] || componentDetailsLookup[String(componentId)];
                  const quantitySource = { ...(componentDetails || {}), ...(component || {}), ...(item || {}) };
                  const itemPrice = item.estimated_unit_cost || item.unitCost || item.unit_price;
                  const unitCost = Number(itemPrice || componentDetails?.price_per_unit || componentDetails?.unit_price || 0);
                  // Use component's discount/tax values (non-editable)
                  const discount = Number(componentDetails?.discount_percent || componentDetails?.discount || 0);
                  const cgst = Number(componentDetails?.cgst_percent || componentDetails?.cgst || 0);
                  const sgst = Number(componentDetails?.sgst_percent || componentDetails?.sgst || 0);
                  const baseSubtotal = unitCost * quantity;
                  const discountAmount = (baseSubtotal * discount) / 100;
                  const taxableSubtotal = baseSubtotal - discountAmount;
                  const cgstAmount = (taxableSubtotal * cgst) / 100;
                  const sgstAmount = (taxableSubtotal * sgst) / 100;
                  const discountedUnit = unitCost - ((unitCost * discount) / 100);
                  const taxPercent = cgst + sgst;
                  const finalUnit = discountedUnit + ((discountedUnit * taxPercent) / 100);
                  const lineTotal = finalUnit * quantity;
                  return (
                    <div key={item.componentId} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          {componentDescription && (
                            <p className="text-xs text-slate-500 mt-1">{componentDescription}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.componentId)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Form Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                          <input
                            type="number"
                            min={getMinimumOrder(quantitySource)}
                            max={getStockAvailable(quantitySource) ?? undefined}
                            value={item.quantity}
                            onChange={(e) => onItemChange(item.componentId, 'quantity', e.target.value)}
                            className={`w-full px-2 py-1.5 border rounded-md text-sm ${showErrors && isQuantityInvalid(item.quantity, quantitySource) ? 'border-rose-500' : 'border-slate-300'}`}
                            required
                          />
                          {showErrors && isQuantityInvalid(item.quantity, quantitySource) && (
                            <p className="mt-1 text-xs text-rose-600">{getQuantityError(item.quantity, quantitySource)}</p>
                          )}
                          {!showErrors && (
                            <p className="mt-1 text-xs text-slate-500">
                              Minimum Order: {getMinimumOrder(quantitySource)} · Stock Available: {getStockAvailable(quantitySource) ?? '—'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Base Price</label>
                          <div className="w-full px-2 py-1.5 border rounded-md text-sm border-slate-300 bg-slate-100 text-slate-700 flex items-center">
                            <span>₹{unitCost.toFixed(2)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Discount %</label>
                          <input
                            type="number"
                            min="0"
                            value={discount}
                            disabled
                            className="w-full px-2 py-1.5 border rounded-md text-sm border-slate-300 bg-slate-100 text-slate-700 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs font-semibold text-amber-700">₹{discountAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">CGST %</label>
                          <input
                            type="number"
                            min="0"
                            value={cgst}
                            disabled
                            className="w-full px-2 py-1.5 border rounded-md text-sm border-slate-300 bg-slate-100 text-slate-700 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs font-semibold text-blue-700">₹{cgstAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">SGST %</label>
                          <input
                            type="number"
                            min="0"
                            value={sgst}
                            disabled
                            className="w-full px-2 py-1.5 border rounded-md text-sm border-slate-300 bg-slate-100 text-slate-700 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs font-semibold text-indigo-700">₹{sgstAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Specifications Row */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Specifications</label>
                        <input
                          value={item.specifications}
                          disabled
                          className="w-full px-2 py-1.5 border rounded-md text-sm border-slate-300 bg-slate-100 text-slate-700 cursor-not-allowed"
                          placeholder="Enter specifications"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                        <p className="text-lg font-bold text-emerald-900">Line Total: ₹{lineTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="bg-white border-2 border-slate-300 rounded-lg p-4 space-y-4">
                  <h4 className="text-base font-semibold text-slate-900">Final Summary</h4>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-600">Total Base Price</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">₹{selectedItemsTotals.baseSubtotal.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-md border border-slate-200 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-700">Discount Applied ({effectiveDiscountPercent.toFixed(2)}%)</p>
                      <p className="text-lg font-bold text-amber-900 mt-1">-₹{selectedItemsTotals.discountAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-md border border-slate-200 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-700">CGST Applied ({effectiveCgstPercent.toFixed(2)}%)</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">₹{selectedItemsTotals.cgstAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-md border border-slate-200 bg-indigo-50">
                      <p className="text-xs font-semibold text-indigo-700">SGST Applied ({effectiveSgstPercent.toFixed(2)}%)</p>
                      <p className="text-lg font-bold text-indigo-900 mt-1">₹{selectedItemsTotals.sgstAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                    <p className="text-sm font-semibold text-emerald-700">Total Price</p>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">₹{selectedItemsTotals.grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  if (editingEnquiryId && onCancelEdit) onCancelEdit();
                }}
                className="rounded-xl bg-slate-200 px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={hasErrors}
                className={`rounded-xl px-6 py-3 text-base font-semibold transition ${
                  hasErrors
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
                title={hasErrors ? 'Please fill all required fields and add at least one item' : ''}
              >
                {editingEnquiryId ? 'Update Enquiry' : 'Create Enquiry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'all' && (
        <div>
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">All Enquiries</h2>
            <p className="text-sm text-slate-500">View and manage your enquiries.</p>
          </div>

          <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4">
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
                <option value="pending">Pending</option>
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
                    onClick={() => setSelectedEnquiry(enquiry)}
                    className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {getEnquiryTitle(enquiry)}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {enquiry.description || 'No description'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(enquiry.status)}`}>
                        {getStatusLabel(enquiry.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Vendor: {vendorLookup[enquiry.vendor_id] || enquiry.vendor_name || enquiry.vendor_id || 'Vendor'}</span>
                      <span>Created: {formatDate(enquiry.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                      {getEnquiryTitle(selectedEnquiry) || 'Enquiry'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      ID: {resolveEnquiryId(selectedEnquiry) || '—'}
                    </p>
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Vendor</label>
                    <p className="text-sm text-slate-900">
                      {vendorLookup[selectedEnquiry.vendor_id] || selectedEnquiry.vendor_name || selectedEnquiry.vendor_id || selectedEnquiry.vendorId || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Required Delivery Date</label>
                    <p className="text-sm text-slate-900">
                      {formatDate(resolveRequiredDeliveryDate(selectedEnquiry))}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Source</label>
                    <p className="text-sm text-slate-900 capitalize">{selectedEnquiry.source || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Created Date</label>
                    <p className="text-sm text-slate-900">
                      {selectedEnquiry.created_at ? new Date(selectedEnquiry.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Line Items</h4>
                  {selectedEnquiry.items && selectedEnquiry.items.length > 0 ? (
                    <>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Component</th>
                              <th className="px-4 py-3 text-left font-semibold">Specifications</th>
                              <th className="px-4 py-3 text-right font-semibold">Qty</th>
                              <th className="px-4 py-3 text-right font-semibold">Unit</th>
                              <th className="px-4 py-3 text-right font-semibold">Unit Cost</th>
                              <th className="px-4 py-3 text-right font-semibold">Disc %</th>
                              <th className="px-4 py-3 text-right font-semibold">CGST %</th>
                              <th className="px-4 py-3 text-right font-semibold">SGST %</th>
                              <th className="px-4 py-3 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEnquiry.items.map((item, idx) => {
                            const componentId = resolveComponentId(item);
                            const component = (
                              componentDetailsLookup[componentId]
                              || componentDetailsLookup[String(componentId)]
                              || {}
                            );

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
                            const basePrice = hasBasePrice ? resolveNumber(rawBasePrice, 0) : null;
                            const rawDiscount = item.discount_percent
                              ?? item.discount
                              ?? item.discountPercent
                              ?? component.discount_percent
                              ?? component.discountPercent
                              ?? component.discount;
                            const hasDiscount = rawDiscount !== null && rawDiscount !== undefined && rawDiscount !== '';
                            const discount = hasDiscount ? resolveNumber(rawDiscount, 0) : 0;
                            const rawCgst = item.cgst
                              ?? item.cgst_percent
                              ?? item.cgstPercent
                              ?? component.cgst
                              ?? component.cgst_percent;
                            const hasCgst = rawCgst !== null && rawCgst !== undefined && rawCgst !== '';
                            const cgst = hasCgst ? resolveNumber(rawCgst, 0) : 0;
                            const rawSgst = item.sgst
                              ?? item.sgst_percent
                              ?? item.sgstPercent
                              ?? component.sgst
                              ?? component.sgst_percent;
                            const hasSgst = rawSgst !== null && rawSgst !== undefined && rawSgst !== '';
                            const sgst = hasSgst ? resolveNumber(rawSgst, 0) : 0;
                            const specifications = item.specifications || item.specification || '—';
                            const discountedPrice = hasBasePrice ? basePrice - ((basePrice * discount) / 100) : 0;
                            const totalTaxPercent = Number(cgst) + Number(sgst);
                            const finalPrice = hasBasePrice ? discountedPrice + ((discountedPrice * totalTaxPercent) / 100) : 0;
                            const qty = resolveNumber(item.quantity, 0);
                            const baseSubtotal = hasBasePrice ? basePrice * qty : 0;
                            const discountAmount = (baseSubtotal * discount) / 100;
                            const taxableSubtotal = baseSubtotal - discountAmount;
                            const cgstAmount = (taxableSubtotal * cgst) / 100;
                            const sgstAmount = (taxableSubtotal * sgst) / 100;
                            const total = hasBasePrice ? finalPrice * qty : null;
                            return (
                              <tr key={item.item_id || item.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-700">{resolveComponentName(item, component) || '—'}</td>
                                <td className="px-4 py-3 text-slate-700">{specifications}</td>
                                <td className="px-4 py-3 text-right text-slate-700">{qty}</td>
                                <td className="px-4 py-3 text-right text-slate-700">
                                  {hasUnit ? resolvedUnit : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700">{hasBasePrice ? `₹${basePrice.toFixed(2)}` : '—'}</td>
                                <td className="px-4 py-3 text-right text-slate-700">
                                  <div className="flex flex-col items-end">
                                    <span>{hasDiscount ? `${discount}%` : '—'}</span>
                                    <span className="text-[11px] font-semibold text-amber-700">{hasBasePrice ? `₹${discountAmount.toFixed(2)}` : '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700">
                                  <div className="flex flex-col items-end">
                                    <span>{hasCgst ? `${cgst}%` : '—'}</span>
                                    <span className="text-[11px] font-semibold text-blue-700">{hasBasePrice ? `₹${cgstAmount.toFixed(2)}` : '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700">
                                  <div className="flex flex-col items-end">
                                    <span>{hasSgst ? `${sgst}%` : '—'}</span>
                                    <span className="text-[11px] font-semibold text-indigo-700">{hasBasePrice ? `₹${sgstAmount.toFixed(2)}` : '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-700">{total !== null ? `₹${total.toFixed(2)}` : '—'}</td>
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
                    <p className="text-sm text-slate-500 p-3 bg-slate-50 rounded-lg">No line items in this enquiry.</p>
                  )}
                </div>
                
                {selectedEnquiry.status === 'rejected' && selectedEnquiry.rejection_reason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-rose-900 mb-2">Vendor Rejection Reason:</p>
                    <p className="text-sm text-rose-800">{selectedEnquiry.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 flex-wrap">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {selectedEnquiry.status === 'rejected' && onEditEnquiry && (
                <button
                  onClick={() => {
                    handleResubmitEnquiry(selectedEnquiry);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition"
                >
                  Resubmit with Changes
                </button>
              )}
              {canEditSelectedEnquiry && (
                <button
                  onClick={() => {
                    onEditEnquiry(selectedEnquiry);
                    setSelectedEnquiry(null);
                    setActiveTab('create');
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition"
                >
                  Edit Enquiry
                </button>
              )}
              {selectedEnquiry.status !== 'rejected' && (
                <button
                  onClick={() => {
                    setQuotationEnquiry(selectedEnquiry);
                    setShowQuotationModal(true);
                    setSelectedEnquiry(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  View Quotations
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuotationModal && quotationEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Quotations</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {getEnquiryTitle(quotationEnquiry)}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowQuotationModal(false);
                  setQuotationEnquiry(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {enquiryQuotations.length === 0 ? (
                <p className="text-sm text-slate-500">Quotation is not raised yet.</p>
              ) : (
                <div className="space-y-3">
                  {enquiryQuotations.map((quotation) => (
                    <button
                      key={quotation.quotation_id}
                      onClick={() => setSelectedQuotationDetail(quotation)}
                      className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 hover:shadow-md hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {quotation.quotation_number || `Quotation ${quotation.quotation_id}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            Vendor: {vendorLookup[quotation.vendor_id] || quotation.vendor_name || quotation.vendor_id || 'Vendor'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Date: {formatDate(quotation.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getQuotationStatusColor(quotation.status)}`}>
                            {getQuotationStatusLabel(quotation.status)}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(quotation.total_amount)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => {
                  setShowQuotationModal(false);
                  setQuotationEnquiry(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
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
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedQuotationDetail.quotation_number || `Quotation ${selectedQuotationDetail.quotation_id}`}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vendor: {vendorLookup[selectedQuotationDetail.vendor_id] || selectedQuotationDetail.vendor_name || selectedQuotationDetail.vendor_id || 'Vendor'}
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
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getQuotationStatusColor(selectedQuotationDetail.status)}`}>
                    {getQuotationStatusLabel(selectedQuotationDetail.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Amount</label>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedQuotationDetail.total_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <p className="text-sm text-slate-900">{formatDate(selectedQuotationDetail.created_at)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Line Items</h4>
                {selectedQuotationDetail.items?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-xs uppercase text-slate-500 bg-slate-50">
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
                        {selectedQuotationDetail.items.map((item, idx) => (
                          <tr key={item.item_id || idx} className="border-b border-slate-100">
                            <td className="py-2 px-3 text-slate-700">
                              {componentLookup[item.component_id] || `Component ${item.component_id}`}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-700">{item.quantity}</td>
                            <td className="py-2 px-3 text-right text-slate-700">₹{item.unit_price}</td>
                            <td className="py-2 px-3 text-right text-slate-700">{item.discount_percent || 0}%</td>
                            <td className="py-2 px-3 text-right text-slate-700">{item.cgst_percent || 0}%</td>
                            <td className="py-2 px-3 text-right text-slate-700">{item.sgst_percent || 0}%</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900">₹{item.line_total}</td>
                          </tr>
                        ))}
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
                onClick={() => setSelectedQuotationDetail(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              {selectedQuotationDetail.status === 'sent' && (
                <>
                  <button
                    onClick={() => {
                      if (onRejectQuotation) {
                        onRejectQuotation(selectedQuotationDetail.quotation_id);
                        setSelectedQuotationDetail(null);
                        setShowQuotationModal(false);
                        setQuotationEnquiry(null);
                      }
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      if (onAcceptQuotation) {
                        onAcceptQuotation(selectedQuotationDetail.quotation_id);
                        setSelectedQuotationDetail(null);
                        setShowQuotationModal(false);
                        setQuotationEnquiry(null);
                      }
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition"
                  >
                    Accept
                  </button>
                </>
              )}
              {selectedQuotationDetail.status === 'accepted' && !hasLoi(selectedQuotationDetail.quotation_id) && onGoToLois && (
                <button
                  onClick={() => {
                    onGoToLois(selectedQuotationDetail);
                    setSelectedQuotationDetail(null);
                    setShowQuotationModal(false);
                    setQuotationEnquiry(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  Create LOI
                </button>
              )}
              {hasLoi(selectedQuotationDetail.quotation_id) && (
                <span className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
                  LOI Created ✓
                </span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PurchaseEnquiriesTab;
