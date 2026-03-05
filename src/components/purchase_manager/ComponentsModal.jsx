import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

// Modal to display components for a product
function ComponentsModal({ selectedProduct, components, onClose }) {
  if (!selectedProduct) return null;
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [showVendorsTab, setShowVendorsTab] = useState(false);

  const getComponentId = (component) => component.componentId || component.componentid;
  const getComponentName = (component) => component.component_name || component.name || 'Component';
  const getUnit = (component) => component.unit_of_measurement || component.unit || '—';
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

  const fetchVendors = async (componentCode) => {
    try {
      setVendorsLoading(true);
      const { data } = await apiClient.get(`/api/components/${componentCode}/vendors`);
      setVendors(data.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
    setShowVendorsTab(false);
    if (component.component_code) {
      fetchVendors(component.component_code);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Components Needed</h2>
            <p className="text-sm text-slate-500 mt-1">Product: {selectedProduct.title}</p>
          </div>
          <button
            className="text-3xl text-slate-500 hover:text-slate-900 transition-colors leading-none"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {components.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-600">No components found for this product.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {components.map((component) => (
                <div key={getComponentId(component)} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{getComponentName(component)}</p>
                      <p className="text-xs text-slate-500">Code: {component.component_code || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-900">{formatCurrency(component.cost_per_unit)}</p>
                      <p className="text-xs text-slate-500">Unit: {getUnit(component)}</p>
                    </div>
                  </div>
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>HSN: {component.hsn_code || '—'}</span>
                    <span>CGST: {component.cgst ?? 0}%</span>
                    <span>Min Stock: {component.min_stock_level ?? 0}</span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleComponentSelect(component)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            type="button"
            className="px-5 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 font-semibold transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {selectedComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedComponent(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500 uppercase">Component Details</p>
                <h3 className="text-xl font-semibold text-slate-900">{getComponentName(selectedComponent)}</h3>
                <p className="text-xs text-slate-500 mt-1">Code: {selectedComponent.component_code || '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComponent(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6">
              <button
                onClick={() => setShowVendorsTab(false)}
                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
                  !showVendorsTab
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Component Info
              </button>
              <button
                onClick={() => setShowVendorsTab(true)}
                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
                  showVendorsTab
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Vendors ({vendors.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!showVendorsTab ? (
                /* Component Details Tab */
                <div className="p-4 space-y-4">
                  {selectedComponent.description && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                      <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                        {selectedComponent.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Unit</label>
                      <p className="text-slate-900">{getUnit(selectedComponent)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">HSN Code</label>
                      <p className="text-slate-900">{selectedComponent.hsn_code || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">CGST</label>
                      <p className="text-slate-900">{selectedComponent.cgst ?? 0}%</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Min Stock Level</label>
                      <p className="text-slate-900">{selectedComponent.min_stock_level ?? 0}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">PO Quantity</label>
                      <p className="text-slate-900">{selectedComponent.purchase_order_quantity ?? 0}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Cost Per Unit</label>
                      <p className="text-slate-900">{formatCurrency(selectedComponent.cost_per_unit)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Item No</label>
                      <p className="text-slate-900">{selectedComponent.item_no || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Size</label>
                      <p className="text-slate-900">{selectedComponent.size ?? '—'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Color</label>
                      <p className="text-slate-900">{selectedComponent.color || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Active</label>
                      <p className="text-slate-900">{selectedComponent.active ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Created</label>
                      <p className="text-slate-900">{formatDate(selectedComponent.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Updated</label>
                      <p className="text-slate-900">{formatDate(selectedComponent.updated_at)}</p>
                    </div>
                  </div>

                  {selectedComponent.img && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Image</label>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <img
                          src={selectedComponent.img}
                          alt={getComponentName(selectedComponent)}
                          className="w-full max-h-48 object-contain bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Vendors Tab */}
            {showVendorsTab && (
              <div className="p-4 space-y-3">
                {vendorsLoading ? (
                  <div className="text-center py-10">
                    <p className="text-slate-600">Loading vendors...</p>
                  </div>
                ) : vendors.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-600">No vendors supplying this component yet.</p>
                  </div>
                ) : (
                  vendors.map((vendor) => (
                    <div key={vendor.componentid} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{vendor.vendorregistration?.company_name || 'Vendor'}</h4>
                          <p className="text-xs text-slate-500">{vendor.vendorregistration?.contact_email || '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-slate-900">{formatCurrency(vendor.price_per_unit)}</p>
                          <p className="text-xs text-slate-500">Price per unit</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 mb-3">
                        <span>Stock: {vendor.stock_available || 0}</span>
                        <span>Lead: {vendor.lead_time_days || 0} days</span>
                        <span>Min Order: {vendor.minimum_order_quantity || 1}</span>
                        <span>Discount: {vendor.discount_percent || 0}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 uppercase">CGST:</span>
                          <p className="text-slate-900">{vendor.cgst || 0}%</p>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase">SGST:</span>
                          <p className="text-slate-900">{vendor.sgst || 0}%</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end p-4 border-t border-slate-200">
              <button
                type="button"
                className="px-5 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 font-semibold transition-colors"
                onClick={() => setSelectedComponent(null)}
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

export default ComponentsModal;
