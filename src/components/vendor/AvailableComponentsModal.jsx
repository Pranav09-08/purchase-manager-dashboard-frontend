import { useState, useEffect } from 'react';
import { listAvailableVendorComponents, addAvailableVendorComponent } from '../../api/vendor/components.api';

function AvailableComponentsModal({ isOpen, onClose, onComponentAdded }) {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [formData, setFormData] = useState({
    pricePerUnit: '',
    currentStock: '',
    leadTimeDays: '',
    minOrderQuantity: '',
    discount: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableComponents();
    }
  }, [isOpen]);

  const fetchAvailableComponents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await listAvailableVendorComponents(token);
      setComponents(data.components || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch available components');
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComponent = (component) => {
    setSelectedComponent(component);
    setFormData({
      pricePerUnit: '',
      currentStock: '0',
      leadTimeDays: '0',
      minOrderQuantity: '1',
      discount: '0',
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComponent) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        componentCode: selectedComponent.component_code,
        pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
        currentStock: parseInt(formData.currentStock) || 0,
        leadTimeDays: parseInt(formData.leadTimeDays) || 0,
        minOrderQuantity: parseInt(formData.minOrderQuantity) || 1,
        discount: parseFloat(formData.discount) || 0,
      };

      const token = localStorage.getItem('token');
      const { data } = await addAvailableVendorComponent(token, payload);
      setSuccess(`${selectedComponent.component_name} added successfully!`);
      setSelectedComponent(null);
      // Refresh available components
      setTimeout(() => {
        fetchAvailableComponents();
        if (onComponentAdded) {
          onComponentAdded(data.component);
        }
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add component');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add Components</h2>
            <p className="text-sm text-slate-600 mt-1">Select components from company catalog</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              {success}
            </div>
          )}

          {!selectedComponent ? (
            <>
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-slate-600">Loading available components...</p>
                </div>
              ) : components.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-600">No available components at the moment.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map((component) => (
                    <div
                      key={component.componentId || component.componentid || component.component_code}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 cursor-pointer transition"
                      onClick={() => handleSelectComponent(component)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{component.component_name}</h4>
                          <p className="text-xs text-slate-500 mt-1">Code: {component.component_code || '—'}</p>
                          <p className="text-sm text-slate-600 mt-2">{component.description || '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500">
                        <span>Unit: {component.unit_of_measurement || '—'}</span>
                        <span>Size: {component.size ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Selected Component Form */
            <div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">{selectedComponent.component_name}</h3>
                <p className="text-sm text-slate-600">{selectedComponent.description || '—'}</p>
                <p className="text-xs text-slate-500 mt-2">Code: {selectedComponent.component_code}</p>
                <p className="text-xs text-slate-500 mt-1">Unit: {selectedComponent.unit_of_measurement || '—'} · Size: {selectedComponent.size ?? '—'}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price Per Unit *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="pricePerUnit"
                      value={formData.pricePerUnit}
                      onChange={handleInputChange}
                      required
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Stock</label>
                    <input
                      type="number"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Lead Time (Days)</label>
                    <input
                      type="number"
                      name="leadTimeDays"
                      value={formData.leadTimeDays}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Min Order Qty</label>
                    <input
                      type="number"
                      name="minOrderQuantity"
                      value={formData.minOrderQuantity}
                      onChange={handleInputChange}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Discount %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Final Price (GST)</label>
                    <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-semibold">
                      ₹{(
                        (parseFloat(formData.pricePerUnit) || 0) *
                        (1 + ((parseFloat(selectedComponent.cgst) || 0) + (parseFloat(selectedComponent.sgst) || 0)) / 100))
                        .toFixed(2)
                      }
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedComponent(null)}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold transition disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Component'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AvailableComponentsModal;
