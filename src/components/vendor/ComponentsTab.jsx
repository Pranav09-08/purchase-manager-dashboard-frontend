/**
 * ComponentsTab - Vendor component management interface
 * 
 * Features:
 * - Display all vendor components with approval status (approved/pending/rejected)
 * - Real-time status indicators and visual feedback
 * - Rejection reason display when component is rejected by PM
 * - Resubmit workflow for rejected components
 * - Add new components or from PM's required list
 * - Component details modal with full specifications
 * - Submission tracking (shows resubmission count)
 * - Filter by status (All/Pending/Approved/Rejected)
 * 
 * Status Flow:
 * 1. Vendor creates component (status: pending)
 * 2. PM reviews and approves or rejects with reason
 * 3. If rejected, vendor can update and resubmit
 * 4. Component auto-resets to pending on resubmit
 * 5. If approved, component is ready for purchase orders
 * 
 * UI Elements:
 * - Status badges with color coding (emerald/amber/rose)
 * - Rejection reason banner (when applicable)
 * - Submission counter for resubmitted items
 * - Quick action buttons (edit/delete/resubmit)
 * - Comprehensive details modal for each component
 */

// Vendor components list and required components
import { useState } from 'react';
import AvailableComponentsModal from './AvailableComponentsModal';
import apiClient from '../../api/apiClient';

function ComponentsTab({
  components,
  onOpenAddModal,
  onEditComponent,
  onDeleteComponent,
  onComponentAdded,
}) {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const closeDetails = () => setSelectedComponent(null);
  const getUnit = (component) => component.unit_of_measurement || component.unit || '—';

  const getStatusColor = (status) => {
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    if (status === 'pending') return 'Pending Review';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return status || 'Unknown';
  };

  const handleUpdateComponent = async (component) => {
    setLoading(true);
    try {
      const componentId = component.componentid || component.componentId || component.component_id || component.id;
      const { data } = await apiClient.put(`/vendor/components/${componentId}`, component);
      
      if (data.resubmitted) {
        alert('Component resubmitted successfully! It\'s now pending PM review.');
      } else {
        alert('Component updated successfully!');
      }

      closeDetails();
      if (onComponentAdded) onComponentAdded();
    } catch (error) {
      alert('Failed to update component. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = components.filter(c => c.status === 'pending').length;
  const approvedCount = components.filter(c => c.status === 'approved').length;
  const rejectedCount = components.filter(c => c.status === 'rejected').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Components Inventory</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your component catalog</p>
          {(pendingCount > 0 || rejectedCount > 0) && (
            <p className="text-xs text-amber-700 mt-2 font-semibold">
              {pendingCount > 0 && `${pendingCount} pending PM review`}
              {pendingCount > 0 && rejectedCount > 0 && ' · '}
              {rejectedCount > 0 && `${rejectedCount} need updates`}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAvailableModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add from Company</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      <div>
        {components.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Components Yet</h3>
            <p className="text-gray-600 mb-6">Start building your inventory by adding your first component.</p>
            <button
              onClick={onOpenAddModal}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Component
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Your Added Components</h3>
              <span className="text-xs font-semibold text-slate-500 uppercase">Total: {components.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {components.map((component) => {
                const componentId = component.componentid || component.componentId || component.component_id || component.id;
                return (
                <div key={componentId} className="data-card">
                  {/* Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-slate-900">{component.component_name}</h4>
                      <p className="text-xs text-slate-500">{component.item_no ? `Item No: ${component.item_no}` : 'Catalog item'}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(component.status)} flex-shrink-0`}>
                      {getStatusLabel(component.status)}
                    </span>
                  </div>

                  {/* Rejection Reason */}
                  {component.status === 'rejected' && component.rejection_reason && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <p className="text-xs font-semibold text-rose-900 mb-1">PM's Feedback:</p>
                      <p className="text-sm text-rose-700">{component.rejection_reason}</p>
                    </div>
                  )}

                  {/* Submission Count */}
                  {component.submission_count > 1 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Resubmitted {component.submission_count} times
                    </p>
                  )}

                  <div className="data-grid">
                    <div className="data-kv">
                      <span className="data-label">Stock</span>
                      <span className="data-value">{component.stock_available ?? 0}</span>
                    </div>
                    <div className="data-kv">
                      <span className="data-label">Unit</span>
                      <span className="data-value">{getUnit(component)}</span>
                    </div>
                    <div className="data-kv">
                      <span className="data-label">Base Price</span>
                      <span className="data-value">₹{component.price_per_unit || 0}</span>
                    </div>
                    <div className="data-kv">
                      <span className="data-label">Final Price</span>
                      <span className="data-value">
                        ₹{(
                          (Number(component.price_per_unit) || 0) *
                          (1 + ((Number(component.cgst) || 0) + (Number(component.sgst) || 0)) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedComponent(component)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                    >
                      View
                    </button>
                    {component.status !== 'approved' && (
                      <button
                        onClick={() => onEditComponent(component)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        {component.status === 'rejected' ? 'Update & Resubmit' : 'Edit'}
                      </button>
                    )}
                    {component.status === 'approved' && (
                      <button
                        onClick={() => onEditComponent(component)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Edit (Approved)
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteComponent(componentId)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Component Details</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedComponent.component_name}</h3>
                <p className="text-sm text-slate-600 mt-1">Item No: {selectedComponent.item_no || '—'}</p>
                {selectedComponent.status && (
                  <p className={`text-xs font-semibold mt-2 inline-block px-2 py-1 rounded ${getStatusColor(selectedComponent.status)}`}>
                    {getStatusLabel(selectedComponent.status)}
                  </p>
                )}
              </div>
              <button
                onClick={closeDetails}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Rejection Reason in Modal */}
            {selectedComponent.status === 'rejected' && selectedComponent.rejection_reason && (
              <div className="px-6 pt-4 pb-2 bg-rose-50 border-b border-rose-200">
                <p className="text-xs font-semibold text-rose-900 mb-2">PM's Feedback - Please Address:</p>
                <p className="text-sm text-rose-700 mb-3">{selectedComponent.rejection_reason}</p>
                <p className="text-xs text-rose-600">Update your component details below to address the feedback, then click "Update & Resubmit".</p>
              </div>
            )}

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Description</p>
                <p className="text-slate-900 mt-1">{selectedComponent.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Specifications</p>
                <p className="text-slate-900 mt-1">{selectedComponent.specifications || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Measurement Unit</p>
                <p className="text-slate-900 mt-1">{selectedComponent.unit_of_measurement || selectedComponent.unit || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Color</p>
                <p className="text-slate-900 mt-1">{selectedComponent.color || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Price per Unit</p>
                <p className="text-slate-900 mt-1">₹{selectedComponent.price_per_unit || 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  CGST: ₹{(((Number(selectedComponent.price_per_unit) || 0) * (Number(selectedComponent.cgst) || 0)) / 100).toFixed(2)} ·
                  SGST: ₹{(((Number(selectedComponent.price_per_unit) || 0) * (Number(selectedComponent.sgst) || 0)) / 100).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Final Price (GST): ₹{(
                    (Number(selectedComponent.price_per_unit) || 0) *
                    (1 + ((Number(selectedComponent.cgst) || 0) + (Number(selectedComponent.sgst) || 0)) / 100)
                  ).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Stock Available</p>
                <p className="text-slate-900 mt-1">{selectedComponent.stock_available ?? 0}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Lead Time</p>
                <p className="text-slate-900 mt-1">{selectedComponent.lead_time_days || 0} days</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Tax & Discount</p>
                <p className="text-slate-900 mt-1">
                  CGST {selectedComponent.cgst || 0}% · SGST {selectedComponent.sgst || 0}% · Discount {selectedComponent.discount_percent || 0}%
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={closeDetails}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Close
              </button>
              {selectedComponent.status !== 'approved' && (
                <button
                  onClick={() => {
                    onEditComponent(selectedComponent);
                    closeDetails();
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (selectedComponent.status === 'rejected' ? 'Edit Component' : 'Edit')}
                </button>
              )}
              {selectedComponent.status !== 'approved' && selectedComponent.status === 'rejected' && (
                <button
                  onClick={() => handleUpdateComponent(selectedComponent)}
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? 'Resubmitting...' : 'Resubmit for Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AvailableComponentsModal 
        isOpen={showAvailableModal}
        onClose={() => setShowAvailableModal(false)}
        onComponentAdded={() => {
          if (onComponentAdded) onComponentAdded();
        }}
      />
    </div>
  );
}

export default ComponentsTab;
