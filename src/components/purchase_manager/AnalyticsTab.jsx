import { useMemo, useState } from 'react';

// Purchase manager analytics dashboard
function AnalyticsTab({ data = null }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    range: 'year',
    month: new Date().getMonth() + 1,
    vendor: 'all',
  });

  const sampleData = {
    rfqRaised: 24,
    rfqAnswered: 18,
    quotationsReceived: 16,
    loisSent: 10,
    invoicesReceived: 8,
    invoicesPending: 3,
    paymentOrdersCount: 6,
    paymentsAmount: 745000,
    vendorsConnected: 14,
    componentsPurchased: 320,
    year: new Date().getFullYear(),
  };

  const analytics = useMemo(() => {
    if (!data) return { payload: sampleData, isSample: true };
    const values = [
      data.rfqRaised,
      data.rfqAnswered,
      data.quotationsReceived,
      data.loisSent,
      data.invoicesReceived,
      data.invoicesPending,
      data.paymentOrdersCount,
      data.paymentsAmount,
      data.vendorsConnected,
      data.componentsPurchased,
    ];
    const hasData = values.some((value) => Number(value) > 0);
    return { payload: hasData ? data : sampleData, isSample: !hasData };
  }, [data]);

  const payload = analytics.payload;
  const sampleBanner = analytics.isSample ? (
    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      Showing sample data (no real data yet).
    </div>
  ) : null;

  const cards = [
    { label: 'RFQs Raised', value: payload.rfqRaised },
    { label: 'RFQs Answered', value: payload.rfqAnswered },
    { label: 'Quotations Received', value: payload.quotationsReceived },
    { label: 'LOIs Sent', value: payload.loisSent },
    { label: 'Invoices Received', value: payload.invoicesReceived },
    { label: 'Invoices Pending', value: payload.invoicesPending },
    { label: 'Payment Orders', value: payload.paymentOrdersCount },
    { label: 'Payments Amount', value: `₹${Number(payload.paymentsAmount || 0).toLocaleString('en-IN')}` },
    { label: 'Vendors Connected', value: payload.vendorsConnected },
    { label: 'Components Purchased (Year)', value: payload.componentsPurchased },
  ];

  const flowStats = [
    { label: 'RFQs', value: payload.rfqRaised },
    { label: 'Quoted', value: payload.quotationsReceived },
    { label: 'LOIs', value: payload.loisSent },
    { label: 'Invoices', value: payload.invoicesReceived },
    { label: 'Payments', value: payload.paymentOrdersCount },
  ];

  const maxFlow = Math.max(...flowStats.map((item) => item.value), 1);

  const invoiceStats = [
    { label: 'Received', value: payload.invoicesReceived, color: 'bg-emerald-500' },
    { label: 'Pending', value: payload.invoicesPending, color: 'bg-amber-500' },
  ];
  const maxInvoice = Math.max(...invoiceStats.map((item) => item.value), 1);

  const paymentBar = Math.min((Number(payload.paymentsAmount || 0) / 1000000) * 100, 100);

  const illustration = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160">
      <rect width="320" height="160" rx="16" fill="#F8FAFC"/>
      <rect x="24" y="24" width="120" height="16" rx="8" fill="#E2E8F0"/>
      <rect x="24" y="50" width="180" height="10" rx="5" fill="#E2E8F0"/>
      <rect x="24" y="72" width="220" height="10" rx="5" fill="#E2E8F0"/>
      <rect x="24" y="98" width="200" height="12" rx="6" fill="#CBD5F5"/>
      <circle cx="260" cy="64" r="22" fill="#6366F1"/>
      <path d="M248 66l8 8 18-20" stroke="#FFFFFF" stroke-width="4" fill="none"/>
    </svg>`
  )}`;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'vendors', label: 'Vendors & Components' },
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Analytics ({payload.year})</h2>
        <p className="text-sm text-slate-500">Review procurement KPIs and activity trends.</p>
        {sampleBanner}
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-2 font-semibold text-sm transition border-b-2 ${
                activeTab === tab.id
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Filters</div>
          <div className="flex flex-wrap gap-3">
            <select
              name="range"
              value={filters.range}
              onChange={handleFilterChange}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  Month {index + 1}
                </option>
              ))}
            </select>
            <select
              name="vendor"
              value={filters.vendor}
              onChange={handleFilterChange}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="all">All Vendors</option>
              <option value="top-5">Top 5 Vendors</option>
              <option value="new">New Vendors</option>
            </select>
          </div>
          <div className="text-xs text-slate-500">Filters update the view when live data is available.</div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Workflow Volume</h4>
              <span className="text-xs text-slate-500">Counts</span>
            </div>
            <div className="space-y-3">
              {flowStats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${(stat.value / maxFlow) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <img src={illustration} alt="Workflow chart" className="w-full max-w-xs" />
            <p className="text-xs text-slate-500 mt-3">Sample workflow trend</p>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Invoice Status</h4>
              <span className="text-xs text-slate-500">Received vs Pending</span>
            </div>
            <div className="space-y-3">
              {invoiceStats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full`}
                      style={{ width: `${(stat.value / maxInvoice) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <img src={illustration} alt="Invoice chart" className="w-full max-w-xs" />
            <p className="text-xs text-slate-500 mt-3">Sample invoice distribution</p>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">Payments Amount</h4>
              <span className="text-xs text-slate-500">Scale: ₹0–₹10L+</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${paymentBar}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">Total paid: ₹{Number(payload.paymentsAmount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <img src={illustration} alt="Payments chart" className="w-full max-w-xs" />
            <p className="text-xs text-slate-500 mt-3">Sample payments trend</p>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Vendors Connected</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{payload.vendorsConnected}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Components Purchased (Year)</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{payload.componentsPurchased}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsTab;
