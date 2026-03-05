// Display for globally required components (read-only for now)
function RequiredComponentsTab({
  requiredRequests = [],
}) {
  return (
    <div className="space-y-6">

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Components List</h3>
            <p className="text-sm text-slate-600">Vendors see these items in their dashboard.</p>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total: {requiredRequests.length}
          </div>
        </div>
        {requiredRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-600">
            <div className="text-5xl mb-3">📦</div>
            No components added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {requiredRequests.map((req) => (
              <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{req.name || 'Component'}</h4>
                    <p className="text-xs text-slate-500 mt-1">Added {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                    Active
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-4 min-h-[40px]">
                  {req.description || 'No notes provided.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RequiredComponentsTab;
