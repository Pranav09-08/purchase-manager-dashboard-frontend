// Modal for reviewing a single registration
function RegistrationDetailsModal({ selectedRegistration, onClose, onApprove, onReject, onApproveCertificate, onRejectCertificate }) {
  if (!selectedRegistration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900">Registration Details</h2>
          <button className="text-3xl text-slate-500 hover:text-slate-900 transition-colors leading-none" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Company Name</p>
            <p className="text-sm text-slate-900 mt-1">{selectedRegistration.company_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Contact Email</p>
            <p className="text-sm text-slate-900 mt-1">{selectedRegistration.contact_email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Contact Phone</p>
            <p className="text-sm text-slate-900 mt-1">{selectedRegistration.contact_phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
            <p className="text-sm text-slate-900 mt-1">{selectedRegistration.address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Certificate</p>
            {selectedRegistration.certificate_url ? (
              <div className="flex flex-col gap-2 mt-1">
                <a
                  href={selectedRegistration.certificate_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-900 underline"
                >
                  View Certificate
                </a>
                <span className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedRegistration.certificate_status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedRegistration.certificate_status === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {selectedRegistration.certificate_status || 'pending'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-900 mt-1">Not provided</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          {selectedRegistration.certificate_url && onApproveCertificate && (
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              onClick={() => onApproveCertificate(selectedRegistration.vendor_id || selectedRegistration.vendor_id)}
              disabled={selectedRegistration.certificate_status === 'approved'}
            >
              Approve Certificate
            </button>
          )}
          {selectedRegistration.certificate_url && onRejectCertificate && (
            <button
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700"
              onClick={() => onRejectCertificate(selectedRegistration.vendor_id || selectedRegistration.vendor_id)}
              disabled={selectedRegistration.certificate_status === 'rejected'}
            >
              Reject Certificate
            </button>
          )}
          {selectedRegistration.status === 'pending' && (
            <>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                onClick={() => onApprove(selectedRegistration.vendor_id || selectedRegistration.vendor_id)}
              >
                Approve
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                onClick={onReject}
              >
                Reject
              </button>
            </>
          )}
          <button className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-200" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistrationDetailsModal;
