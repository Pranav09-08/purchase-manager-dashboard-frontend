import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listComponentVendors } from '../../api/purchase_manager/components.api';

// Product-specific components view
function ComponentsTab({
  products = [],
  selectedProduct = null,
  components = [],
  vendorCounts = {},
  autoSelectFirstComponent = false,
  onAutoSelectConsumed,
  onSelectProduct,
  onActivateComponent,
}) {
  const { idToken, getIdToken } = useAuth();
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState('');
  const [showVendorsModal, setShowVendorsModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedComponentDetails, setSelectedComponentDetails] = useState(null);

  const getUnit = (component) => component.unit_of_measurement || component.unit || component.measurement_unit || '—';
  const getComponentId = (component) => component.componentId || component.componentid || component.component_id || component.id;
  const getComponentName = (component) => component.component_name || component.name || 'Component';
  const getComponentCode = (component) => component.component_code || component.componentCode || component.componentcode || '';
  const getComponentVendorKey = (component) => getComponentCode(component) || getComponentNameKey(component);
  const getComponentNameKey = (component) => component.component_name || component.name || '';
  const normalizeVendorCountKey = (value) => String(value || '').trim().toLowerCase();
  const getVendorCount = (component) => {
    const code = getComponentCode(component);
    const name = getComponentNameKey(component);
    const candidateKeys = [
      getComponentVendorKey(component),
      code,
      name,
      normalizeVendorCountKey(code),
      normalizeVendorCountKey(name),
    ].filter(Boolean);

    for (const key of candidateKeys) {
      if (vendorCounts[key] !== undefined) {
        return vendorCounts[key];
      }
    }

    return 0;
  };
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    setSelectedComponent(null);
    setVendors([]);
    setVendorsError('');
    setShowVendorsModal(false);
    setSelectedVendor(null);
    setSelectedComponentDetails(null);
  }, [selectedProduct?.productId, selectedProduct?.productid, components]);

  useEffect(() => {
    if (!autoSelectFirstComponent) return;
    if (!components.length) return;
    handleViewVendors(components[0]);
    if (onAutoSelectConsumed) onAutoSelectConsumed();
  }, [autoSelectFirstComponent, components]);

  const fetchVendors = async (componentCode, componentName) => {
    if (!componentCode && !componentName) {
      setVendors([]);
      setVendorsError('Component code or name missing for vendor lookup.');
      return;
    }
    try {
      setVendorsLoading(true);
      setVendorsError('');
      const token = idToken || await getIdToken(true);
      const data = await listComponentVendors(token, { componentCode, componentName });
      setVendors(data.vendors || []);
    } catch (err) {
      setVendors([]);
      setVendorsError(err?.response?.data?.error || err.message || 'Failed to fetch vendors');
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleViewVendors = (component) => {
    setSelectedComponent(component);
    setSelectedVendor(null);
    setShowVendorsModal(true);
    fetchVendors(getComponentCode(component), getComponentNameKey(component));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Select Product</h3>
            <p className="text-sm text-slate-600">View components product-wise</p>
          </div>
          <div className="w-full md:w-96">
            <select
              value={selectedProduct?.productId || selectedProduct?.productid || ''}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.productId || product.productid} value={product.productId || product.productid}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Components for {selectedProduct.title}</h3>
              <p className="text-sm text-slate-600">Required components for this product</p>
            </div>
          </div>

          {components.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-600">No components added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {components.map((component) => (
                <div key={getComponentId(component)} className="data-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{getComponentName(component)}</h4>
                      <p className="text-xs text-slate-500">{component.details || 'Product component'}</p>
                    </div>
                    <span
                      className={`data-pill ${component.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                    >
                      {component.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 min-h-[40px]">
                    {component.description || component.details || 'No description provided.'}
                  </p>
                  <div className="data-grid">
                    <div className="data-kv">
                      <span className="data-label">Unit</span>
                      <span className="data-value">{getUnit(component)}</span>
                    </div>
                    <div className="data-kv">
                      <span className="data-label">Vendors</span>
                      <span className="data-value">
                        {getVendorCount(component)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onActivateComponent?.(component)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                          component.active
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {component.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedComponentDetails(component)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        View Details
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewVendors(component)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                    >
                      View Vendors
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showVendorsModal && selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowVendorsModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Vendor List</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{getComponentName(selectedComponent)}</h3>
                <p className="text-sm text-slate-600 mt-1">Vendors offering this component</p>
              </div>
              <button
                onClick={() => setShowVendorsModal(false)}
                className="text-slate-500 hover:text-slate-700"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {vendorsError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                  {vendorsError}
                </div>
              )}

              {vendorsLoading ? (
                <div className="py-10 text-center">
                  <p className="text-slate-600">Loading vendors...</p>
                </div>
              ) : vendors.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-600">No vendors supplying this component yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendors.map((vendor) => (
                    <div key={vendor.componentid} className="data-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="data-title">
                            {vendor.vendorregistration?.company_name || vendor.vendorregistration?.contact_person || 'Vendor'}
                          </h4>
                          <p className="data-subtitle">{vendor.vendorregistration?.contact_email || '—'}</p>
                        </div>
                        <span className={`data-pill ${Number(vendor.current_stock ?? vendor.stock_available ?? 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {Number(vendor.current_stock ?? vendor.stock_available ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="data-grid mt-3">
                        <div className="data-kv">
                          <span className="data-label">Price</span>
                          <span className="data-value">{formatCurrency(vendor.price_per_unit)}</span>
                        </div>
                        <div className="data-kv">
                          <span className="data-label">Stock</span>
                          <span className="data-value">{vendor.current_stock ?? vendor.stock_available ?? 0}</span>
                        </div>
                        <div className="data-kv">
                          <span className="data-label">Lead Time</span>
                          <span className="data-value">{vendor.lead_time_days || 0} days</span>
                        </div>
                        <div className="data-kv">
                          <span className="data-label">Min Order</span>
                          <span className="data-value">
                            {vendor.minimum_order_quantity ?? vendor.minimum_order_qty ?? vendor.min_order_quantity ?? 1}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedVendor(vendor)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedComponentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedComponentDetails(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Component Details</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{getComponentName(selectedComponentDetails)}</h3>
                <p className="text-sm text-slate-600 mt-1">{getComponentCode(selectedComponentDetails) || 'No component code'}</p>
              </div>
              <button
                onClick={() => setSelectedComponentDetails(null)}
                className="text-slate-500 hover:text-slate-700"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Description</p>
                <p className="text-slate-900 mt-1">{selectedComponentDetails.description || selectedComponentDetails.details || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Measurement Unit</p>
                <p className="text-slate-900 mt-1">{getUnit(selectedComponentDetails)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Component Code</p>
                <p className="text-slate-900 mt-1">{getComponentCode(selectedComponentDetails) || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                <p className="text-slate-900 mt-1">{selectedComponentDetails.active ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Vendors</p>
                <p className="text-slate-900 mt-1">{getVendorCount(selectedComponentDetails)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Product</p>
                <p className="text-slate-900 mt-1">{selectedProduct?.title || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedVendor(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Vendor Component</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedVendor.vendorregistration?.company_name || selectedVendor.vendorregistration?.contact_person || 'Vendor'}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{selectedVendor.component_name || 'Component'}</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-slate-500 hover:text-slate-700"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Description</p>
                <p className="text-slate-900 mt-1">{selectedVendor.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Specifications</p>
                <p className="text-slate-900 mt-1">{selectedVendor.specifications || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Measurement Unit</p>
                <p className="text-slate-900 mt-1">{selectedVendor.measurement_unit || selectedVendor.unit_of_measurement || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Color</p>
                <p className="text-slate-900 mt-1">{selectedVendor.color || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Price per Unit</p>
                <p className="text-slate-900 mt-1">{formatCurrency(selectedVendor.price_per_unit)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Current Stock</p>
                <p className="text-slate-900 mt-1">{selectedVendor.current_stock ?? selectedVendor.stock_available ?? 0}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Lead Time</p>
                <p className="text-slate-900 mt-1">{selectedVendor.lead_time_days || 0} days</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Minimum Order Qty</p>
                <p className="text-slate-900 mt-1">
                  {selectedVendor.minimum_order_quantity ?? selectedVendor.minimum_order_qty ?? selectedVendor.min_order_quantity ?? 1}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Tax</p>
                <p className="text-slate-900 mt-1">
                  CGST {selectedVendor.cgst || 0}% · SGST {selectedVendor.sgst || 0}%
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Discount</p>
                <p className="text-slate-900 mt-1">{selectedVendor.discount_percent || 0}%</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Item No</p>
                <p className="text-slate-900 mt-1">{selectedVendor.item_no || '—'}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
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

export default ComponentsTab;
