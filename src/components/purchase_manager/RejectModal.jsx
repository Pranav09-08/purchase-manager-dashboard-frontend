// Modal to capture rejection reason
function RejectModal({ selectedRegistration, rejectReason, onRejectReasonChange, onConfirmReject, onCancel }) {
  if (!selectedRegistration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900">Reject Registration</h2>
          <button className="text-3xl text-slate-500 hover:text-slate-900 transition-colors leading-none" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">
            Rejecting: <strong>{selectedRegistration.company_name}</strong>
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Rejection Reason (Optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="Provide a reason for rejection..."
              rows="4"
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
            ></textarea>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700" onClick={onConfirmReject}>
            Confirm Rejection
          </button>
          <button className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-200" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectModal;
