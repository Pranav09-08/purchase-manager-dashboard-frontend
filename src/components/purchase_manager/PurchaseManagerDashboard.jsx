
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../DashboardLayout';
import OverviewTab from './OverviewTab';
import ProductsTab from './ProductsTab';
import ComponentsTab from './ComponentsTab';
import RegistrationsTab from './RegistrationsTab';
import VendorComponentsTab from './VendorComponentsTab';
import PurchaseEnquiriesTab from './PurchaseEnquiriesTab';
import PurchaseQuotationsTab from './PurchaseQuotationsTab';
import PurchaseLoisTab from './PurchaseLoisTab';
import PurchaseOrdersTab from './PurchaseOrdersTab';
import PurchasePaymentsTab from './PurchasePaymentsTab';
import PaymentReceiptsTab from './PaymentReceiptsTab';
import VendorInvoicesTab from './VendorInvoicesTab';
import AnalyticsTab from './AnalyticsTab';
import PurchaseRequestsTab from './PurchaseRequestsTab';
import RegistrationDetailsModal from './RegistrationDetailsModal';

// Import purchase manager APIs
import { listRegistrations, approveRegistration, rejectRegistration } from '../../api/purchase_manager/registrations.api';
import { activateComponent, listAllVendorComponents, listAllComponents, listComponentVendors, listProductComponents } from '../../api/purchase_manager/components.api';
import { listEnquiries, createEnquiry, updateEnquiry, deleteEnquiry, rejectEnquiry } from '../../api/purchase_manager/enquiries.api';
import { listQuotations, getQuotation, acceptQuotation, negotiateQuotation, listCounterQuotations, acceptCounterQuotation, rejectCounterQuotation } from '../../api/purchase_manager/quotations.api';
import { listRequests } from '../../api/purchase_manager/requests.api';
import { listLois, createLoi, updateLoi, deleteLoi, resubmitLoi } from '../../api/purchase_manager/lois.api';
import { listOrders, createOrder } from '../../api/purchase_manager/orders.api';
import { listInvoices, markInvoiceReceived, acceptInvoice, rejectInvoice, markInvoicePaid } from '../../api/purchase_manager/invoices.api';
import { listPayments, createPayment, completePayment, failPayment } from '../../api/purchase_manager/payments.api';
import { getAnalytics } from '../../api/purchase_manager/analytics.api';
import purchaseManagerProductsApi from '../../api/purchase_manager/products.api';

const tabComponents = {
  overview: OverviewTab,
  products: ProductsTab,
  components: ComponentsTab,
  registrations: RegistrationsTab,
  'vendor-products': VendorComponentsTab,
  'purchase-enquiries': PurchaseEnquiriesTab,
  'purchase-quotations': PurchaseQuotationsTab,
  'purchase-lois': PurchaseLoisTab,
  'purchase-orders': PurchaseOrdersTab,
  'purchase-payments': PurchasePaymentsTab,
  'payment-receipts': PaymentReceiptsTab,
  'vendor-invoices': VendorInvoicesTab,
  analytics: AnalyticsTab,
  'purchase-requests': PurchaseRequestsTab,
};

function PurchaseManagerDashboard(props) {
  const { currentUser, idToken, getIdToken, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [purchaseManager, setPurchaseManager] = useState(null);
  const [registrationFilter, setRegistrationFilter] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  
  // Data states
  const [registrations, setRegistrations] = useState([]);
  const [vendorComponents, setVendorComponents] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [counters, setCounters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [lois, setLois] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [components, setComponents] = useState([]);
  const [allComponents, setAllComponents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productComponents, setProductComponents] = useState([]);
  const [vendorCounts, setVendorCounts] = useState({});
  const [autoSelectFirstComponent, setAutoSelectFirstComponent] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  // Enquiry form states
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    vendorId: '',
    title: '',
    description: '',
    requiredDeliveryDate: '',
    source: '',
    _previousRejectionReason: '',
  });
  const [editingEnquiryId, setEditingEnquiryId] = useState(null);
  // LOI form states
  const [loiFormData, setLoiFormData] = useState({
    quotationId: '',
    counterQuotationId: '',
    totalAmount: '',
    expectedDeliveryDate: '',
    termsAndConditions: '',
  });
  const [editingLoiId, setEditingLoiId] = useState(null);
  const [focusQuotationId, setFocusQuotationId] = useState(null);
  const [focusCounterId, setFocusCounterId] = useState(null);
  const [focusOrderId, setFocusOrderId] = useState(null);
  // Payment form states
  const [paymentFormData, setPaymentFormData] = useState({
    orderId: '',
    phase: '',
    amount: '',
    paymentMode: '',
    dueDate: '',
    notes: '',
  });
  const [overviewStats, setOverviewStats] = useState({
    totalVendors: 0,
    approvedVendors: 0,
    pendingVendors: 0,
    rejectedVendors: 0,
    totalVendorComponents: 0,
    recentRegistrations: [],
  });

  const getStoredPurchaseManager = () => {
    try {
      return JSON.parse(localStorage.getItem('purchaseManagerUser') || '{}');
    } catch {
      return {};
    }
  };

  // Set purchase manager from currentUser
  useEffect(() => {
    if (currentUser && !authLoading) {
      setPurchaseManager(currentUser);
    }
  }, [currentUser, authLoading]);

  // Fetch all dashboard data
  useEffect(() => {
    if (!currentUser || authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        let token = idToken;
        if (!token) {
          token = await getIdToken(true);
        }

        if (!token || token.split('.').length !== 3) {
          throw new Error('Invalid authentication token');
        }

        // Fetch all data in parallel
        const [
          registrationsData,
          vendorComponentsData,
          allComponentsData,
          enquiriesData,
          quotationsData,
          countersData,
          requestsData,
          loisData,
          ordersData,
          invoicesData,
          paymentsData,
          productsData,
          analyticsData,
        ] = await Promise.all([
          listRegistrations(token).catch(() => []),
          listAllVendorComponents(token).catch(() => ({ components: [] })),
          listAllComponents(token).catch(() => ({ components: [] })),
          listEnquiries(token).catch(() => ({ enquiries: [] })),
          listQuotations(token).catch(() => ({ quotations: [] })),
          listCounterQuotations(token).catch(() => ({ counters: [] })),
          listRequests(token).catch(() => ({ requests: [] })),
          listLois(token).catch(() => ({ lois: [] })),
          listOrders(token).catch(() => ({ orders: [] })),
          listInvoices(token).catch(() => ({ invoices: [] })),
          listPayments(token).catch(() => ({ payments: [] })),
          purchaseManagerProductsApi.list(token).catch(() => ({ products: [] })),
          getAnalytics(token).catch(() => null),
        ]);

        const regs = Array.isArray(registrationsData) ? registrationsData : [];
        setRegistrations(regs);
        
        const vendorCompsData = vendorComponentsData.components || [];
        setVendorComponents(vendorCompsData);
        
        const allCompsData = allComponentsData.components || [];
        setAllComponents(allCompsData);
        
        const enquiriesDataList = enquiriesData.enquiries || [];
        setEnquiries(enquiriesDataList);
        
        setQuotations(quotationsData.quotations || quotationsData || []);
        setCounters(countersData.counters || countersData || []);
        setRequests(requestsData.requests || requestsData || []);
        setLois(loisData.lois || loisData || []);
        setOrders(ordersData.orders || ordersData || []);
        setInvoices(invoicesData.invoices || invoicesData || []);
        setPayments(paymentsData.payments || paymentsData || []);
        setProducts(productsData.products || productsData || []);
        setAnalytics(analyticsData);

        // Calculate overview stats
        const recentRegs = regs
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5);

        setOverviewStats({
          totalVendors: regs.length,
          approvedVendors: regs.filter(r => r.status === 'approved').length,
          pendingVendors: regs.filter(r => r.status === 'pending').length,
          rejectedVendors: regs.filter(r => r.status === 'rejected').length,
          totalVendorComponents: (vendorComponentsData.components || []).length,
          recentRegistrations: recentRegs,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, idToken, authLoading]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.page) {
        setCurrentPage(e.detail.page);
      }
    };
    window.addEventListener('dashboardPageChange', handler);
    return () => window.removeEventListener('dashboardPageChange', handler);
  }, []);

  // Navigation handlers
  const handleGoToRegistrations = () => {
    setCurrentPage('registrations');
  };

  const handleGoToVendorComponents = () => {
    setCurrentPage('vendor-products');
  };

  const refreshProducts = async (tokenOverride) => {
    const token = tokenOverride || idToken || await getIdToken(true);
    const productsData = await purchaseManagerProductsApi.list(token);
    const list = productsData?.products || productsData || [];
    setProducts(list);
    return list;
  };

  const refreshVendorComponents = async (tokenOverride) => {
    const token = tokenOverride || idToken || await getIdToken(true);
    const vendorComponentsData = await listAllVendorComponents(token);
    const components = vendorComponentsData?.components || [];
    setVendorComponents(components);
    return components;
  };

  const getProductId = (product) => product?.productId || product?.productid;
  const normalizeVendorCountKey = (value) => String(value || '').trim().toLowerCase();

  const loadComponentsForProduct = async (product, tokenOverride) => {
    const productId = getProductId(product);
    if (!productId) {
      setProductComponents([]);
      setVendorCounts({});
      return;
    }

    const token = tokenOverride || idToken || await getIdToken(true);
    const componentsResponse = await listProductComponents(token, productId);
    const components = componentsResponse?.components || [];
    setProductComponents(components);

    const vendorCountPairs = await Promise.all(
      components.map(async (component) => {
        const componentCode = component.component_code || component.componentCode || component.componentcode;
        const componentName = component.component_name || component.name;
        try {
          const response = await listComponentVendors(token, {
            componentCode,
            componentName,
          });
          const count = (response?.vendors || []).length;
          return { componentCode, componentName, count };
        } catch {
          return { componentCode, componentName, count: 0 };
        }
      })
    );

    const counts = vendorCountPairs.reduce((acc, item) => {
      const aliases = [
        item.componentCode,
        normalizeVendorCountKey(item.componentCode),
        item.componentName,
        normalizeVendorCountKey(item.componentName),
      ].filter(Boolean);

      aliases.forEach((key) => {
        acc[key] = item.count;
      });

      const primary = item.componentCode || item.componentName;
      if (primary) acc[primary] = item.count;
      return acc;
    }, {});

    setVendorCounts(counts);
  };

  // Registration handlers
  const handleRegistrationFilterChange = (filter) => {
    setRegistrationFilter(filter);
  };

  const handleViewRegistration = (registration) => {
    setSelectedRegistration(registration);
  };

  const handleCloseRegistrationModal = () => {
    setSelectedRegistration(null);
  };

  const handleApproveRegistration = async (vendorId) => {
    try {
      const token = idToken || await getIdToken(true);
      await approveRegistration(token, vendorId);
      
      // Refresh registrations
      const data = await listRegistrations(token);
      const regs = Array.isArray(data) ? data : [];
      setRegistrations(regs);
      
      // Recalculate overview stats
      const recentRegs = regs
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);
      
      setOverviewStats({
        totalVendors: regs.length,
        approvedVendors: regs.filter(r => r.status === 'approved').length,
        pendingVendors: regs.filter(r => r.status === 'pending').length,
        rejectedVendors: regs.filter(r => r.status === 'rejected').length,
        totalVendorComponents: vendorComponents.length,
        recentRegistrations: recentRegs,
      });
      
      // Close modal if open
      setSelectedRegistration(null);
      
      alert('Registration approved successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (registration) => {
    try {
      const token = idToken || await getIdToken(true);
      await rejectRegistration(token, registration.vendor_id);
      
      // Refresh registrations
      const data = await listRegistrations(token);
      const regs = Array.isArray(data) ? data : [];
      setRegistrations(regs);
      
      // Recalculate overview stats
      const recentRegs = regs
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);
      
      setOverviewStats({
        totalVendors: regs.length,
        approvedVendors: regs.filter(r => r.status === 'approved').length,
        pendingVendors: regs.filter(r => r.status === 'pending').length,
        rejectedVendors: regs.filter(r => r.status === 'rejected').length,
        totalVendorComponents: vendorComponents.length,
        recentRegistrations: recentRegs,
      });
      
      // Close modal if open
      setSelectedRegistration(null);
      
      alert('Registration rejected successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to reject registration');
    }
  };

  // Product handlers
  const handleSelectProduct = (product) => {
    const resolvedProduct = typeof product === 'string'
      ? products.find((p) => String(getProductId(p)) === String(product))
      : product;

    if (!resolvedProduct) {
      setSelectedProduct(null);
      setProductComponents([]);
      setVendorCounts({});
      return;
    }

    setSelectedProduct(resolvedProduct);
    setCurrentPage('components');
    setAutoSelectFirstComponent(false);

    loadComponentsForProduct(resolvedProduct).catch((error) => {
      console.error('Error loading product components:', error);
      setProductComponents([]);
      setVendorCounts({});
    });
  };

  const handleViewVendors = (product) => {
    const resolvedProduct = typeof product === 'string'
      ? products.find((p) => String(getProductId(p)) === String(product))
      : product;

    if (!resolvedProduct) return;

    setSelectedProduct(resolvedProduct);
    setCurrentPage('components');
    setAutoSelectFirstComponent(true);

    loadComponentsForProduct(resolvedProduct).catch((error) => {
      console.error('Error loading product components for vendor view:', error);
      setProductComponents([]);
      setVendorCounts({});
      setAutoSelectFirstComponent(false);
    });
  };

  const handleCreateProduct = async (payload) => {
    try {
      const token = idToken || await getIdToken(true);
      const purchaseManagerUser = getStoredPurchaseManager();
      const fallbackCompanyId = products[0]?.companyId;
      const companyId = payload.companyId || purchaseManagerUser.companyId || fallbackCompanyId;

      if (!companyId) {
        alert('Company ID not found for purchase manager. Please contact support.');
        return;
      }

      const requestPayload = {
        ...payload,
        companyId,
      };

      await purchaseManagerProductsApi.create(token, requestPayload);
      await refreshProducts(token);
      alert('Product created successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (productId, payload) => {
    try {
      const token = idToken || await getIdToken(true);
      await purchaseManagerProductsApi.update(token, productId, payload);
      const updated = await refreshProducts(token);

      const stillSelected = updated.find((p) => getProductId(p) === getProductId(selectedProduct));
      if (stillSelected) {
        setSelectedProduct(stillSelected);
      }

      alert('Product updated successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (product) => {
    const productId = getProductId(product);
    if (!productId) return;
    if (!window.confirm('Delete this product?')) return;

    try {
      const token = idToken || await getIdToken(true);
      await purchaseManagerProductsApi.remove(token, productId);
      const updated = await refreshProducts(token);

      if (selectedProduct && getProductId(selectedProduct) === productId) {
        setSelectedProduct(null);
        setProductComponents([]);
        setVendorCounts({});
      }

      if (!updated.length) {
        setCurrentPage('products');
      }

      alert('Product deleted successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to delete product');
    }
  };

  const handleToggleComponentActive = async (component) => {
    // Extract component ID with all possible field names
    const componentId = component?.componentId || component?.componentid || component?.component_id;
    if (!componentId || !selectedProduct) return;

    const nextActive = !(component?.active ?? true);
    const actionText = nextActive ? 'activate' : 'deactivate';
    
    // Ask for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} "${component.component_name || component.name || 'this component'}"?`
    );
    
    if (!confirmed) return;

    try {
      const token = idToken || await getIdToken(true);
      await activateComponent(token, componentId, nextActive);
      await loadComponentsForProduct(selectedProduct, token);
      alert(nextActive ? 'Component activated successfully' : 'Component deactivated successfully');
    } catch (error) {
      console.error('Error updating component status:', error);
      alert(error.response?.data?.error || error.message || 'Failed to update component status');
    }
  };

  // Purchase Requests handlers
  const handleRaiseEnquiry = async (request) => {
    // Pre-fill form with request data
    setFormData({
      vendorId: '',
      title: request.request_type || 'Request',
      description: request.description || '',
      requiredDeliveryDate: '',
      source: 'planning-request',
    });
    setSelectedItems([]);
    setEditingEnquiryId(null);
    setCurrentPage('purchase-enquiries');
  };

  // Purchase Enquiries handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = (component) => {
    if (!component) return;
    
    const componentId = component.componentid || component.id || component.component_id;
    const componentName = component.component_name || component.name;
    
    // Check if already added
    if (selectedItems.some(item => item.componentId === componentId)) {
      return;
    }
    
    // Extract values with fallback to alternative field names - try multiple options for price
    const unitCost = component.unit_price 
      || component.price 
      || component.base_price 
      || component.cost_price 
      || component.price_per_unit
      || component.cost_per_unit
      || component.estimated_unit_cost 
      || component.unitPrice 
      || component.basePrice
      || 0;
    
    const cgstPercent = component.cgst_percent || component.cgst || 0;
    const sgstPercent = component.sgst_percent || component.sgst || 0;
    const discountPercent = component.discount_percent || component.discount || component.discountPercent || 0;
    const specifications = component.description || component.specifications || '';
    
    console.log('Component being added:', component);
    console.log('Extracted unitCost:', unitCost);
    console.log('All component fields:', Object.keys(component));
    
    setSelectedItems(prev => [...prev, {
      componentId: componentId,
      name: componentName,
      component_id: componentId,
      component_name: componentName,
      quantity: 1,
      specifications: specifications,
      estimated_unit_cost: unitCost,
      discount_percent: discountPercent,
      cgst_percent: cgstPercent,
      sgst_percent: sgstPercent,
    }]);
  };

  const handleRemoveItem = (componentId) => {
    setSelectedItems(prev => prev.filter(item => item.componentId !== componentId));
  };

  const handleItemChange = (componentId, field, value) => {
    setSelectedItems(prev => {
      return prev.map(item => 
        item.componentId === componentId 
          ? { ...item, [field]: value }
          : item
      );
    });
  };

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    
    try {
      const token = idToken || await getIdToken(true);
      
      const payload = {
        vendorId: formData.vendorId,
        title: formData.title,
        description: formData.description,
        requiredDeliveryDate: formData.requiredDeliveryDate,
        source: formData.source,
        items: selectedItems.map(item => ({
          component_id: item.componentId || item.component_id,
          component_name: item.name || item.component_name,
          quantity: Number(item.quantity),
          specifications: item.specifications,
          estimated_unit_cost: item.estimated_unit_cost || 0,
          discount_percent: item.discount_percent || 0,
          cgst_percent: item.cgst_percent || 0,
          sgst_percent: item.sgst_percent || 0,
        })),
      };

      if (editingEnquiryId) {
        // Update existing enquiry
        await updateEnquiry(token, editingEnquiryId, payload);
        alert('Enquiry updated successfully');
      } else {
        // Create new enquiry
        await createEnquiry(token, payload);
        alert('Enquiry created successfully');
      }

      // Refresh enquiries and clear form
      const data = await listEnquiries(token);
      setEnquiries(data.enquiries || []);
      
      setFormData({
        vendorId: '',
        title: '',
        description: '',
        requiredDeliveryDate: '',
        source: '',
        _previousRejectionReason: '',
      });
      setSelectedItems([]);
      setEditingEnquiryId(null);
      
    } catch (error) {
      const errorDetails = error.response?.data?.details;
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save enquiry';
      
      if (errorDetails && Array.isArray(errorDetails)) {
        alert(`${errorMsg}:\n\n${errorDetails.join('\n')}`);
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleEditEnquiry = (enquiry) => {
    if ((enquiry?.status || '').toLowerCase() === 'accepted') {
      alert('Accepted enquiry cannot be edited');
      return;
    }

    setEditingEnquiryId(enquiry.enquiry_id || enquiry.id);
    setFormData({
      vendorId: enquiry.vendor_id || enquiry.vendorId || '',
      title: enquiry.title || enquiry.enquiry_title || '',
      description: enquiry.description || '',
      requiredDeliveryDate: enquiry.required_delivery_date || enquiry.requiredDeliveryDate || enquiry.delivery_date || '',
      source: enquiry.source || '',
      _previousRejectionReason: enquiry.rejection_reason || enquiry.rejectionReason || '',
    });
    
    // Map enquiry items to form items
    const items = (enquiry.items || []).map(item => ({
      componentId: item.component_id || item.componentid || '',
      name: item.component_name || item.name || '',
      component_id: item.component_id || item.componentid || '',
      component_name: item.component_name || item.name || '',
      quantity: item.quantity || item.requiredQuantity || '',
      specifications: item.specifications || item.specification || '',
      estimated_unit_cost: item.estimated_unit_cost || item.unitCost || '',
      discount_percent: item.discount_percent || item.discount || 0,
      cgst_percent: item.cgst_percent || item.cgst || 0,
      sgst_percent: item.sgst_percent || item.sgst || 0,
    }));
    setSelectedItems(items);
  };

  const handleCancelEditEnquiry = () => {
    setEditingEnquiryId(null);
    setFormData({
      vendorId: '',
      title: '',
      description: '',
      requiredDeliveryDate: '',
      source: '',
      _previousRejectionReason: '',
    });
    setSelectedItems([]);
  };

  const handleDeleteEnquiry = async (enquiry) => {
    if (!window.confirm('Delete this enquiry?')) return;

    try {
      const token = idToken || await getIdToken(true);
      const enquiryId = enquiry.enquiry_id || enquiry.id;
      await deleteEnquiry(token, enquiryId);

      // Refresh enquiries
      const data = await listEnquiries(token);
      setEnquiries(data.enquiries || []);
      
      alert('Enquiry deleted successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to delete enquiry');
    }
  };

  const handleRejectEnquiryAction = async (enquiry, rejectionReason) => {
    try {
      const token = idToken || await getIdToken(true);
      const enquiryId = enquiry.enquiry_id || enquiry.id;
      await rejectEnquiry(token, enquiryId, { rejectionReason });

      // Refresh enquiries
      const data = await listEnquiries(token);
      setEnquiries(data.enquiries || []);
      
      alert('Enquiry rejected successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to reject enquiry');
    }
  };

  // Quotation handlers
  const handleAcceptQuotation = async (quotationId) => {
    try {
      const token = idToken || await getIdToken(true);
      await acceptQuotation(token, quotationId);

      // Refresh quotations
      const data = await listQuotations(token);
      setQuotations(data.quotations || data || []);
      
      alert('Quotation accepted successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to accept quotation');
    }
  };

  const handleRequestNegotiation = async (quotationId, notes) => {
    if (!notes) {
      alert('Negotiation notes are required');
      return;
    }

    try {
      const token = idToken || await getIdToken(true);
      await negotiateQuotation(token, quotationId, notes);

      // Refresh quotations
      const data = await listQuotations(token);
      setQuotations(data.quotations || data || []);
      
      alert('Counter quotation request sent successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to request counter quotation');
    }
  };

  // Counter quotation handlers
  const handleAcceptCounter = async (counterId) => {
    try {
      const token = idToken || await getIdToken(true);
      await acceptCounterQuotation(token, counterId);

      // Refresh counters
      const data = await listCounterQuotations(token);
      setCounters(data.counters || data || []);
      
      alert('Counter quotation accepted successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to accept counter quotation');
    }
  };

  const handleRejectCounter = async (counterId) => {
    try {
      const token = idToken || await getIdToken(true);
      await rejectCounterQuotation(token, counterId);

      // Refresh counters
      const data = await listCounterQuotations(token);
      setCounters(data.counters || data || []);
      
      alert('Counter quotation rejected successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to reject counter quotation');
    }
  };

  const handleGoToLois = async (quotationOrCounter) => {
    const quotationId = quotationOrCounter.quotation_id || quotationOrCounter.quotationId;
    const counterId = quotationOrCounter.counter_id || quotationOrCounter.counterId || quotationOrCounter.counter_quotation_id;
    
    try {
      let quotationData = null;
      
      // Fetch quotation details to pre-fill LOI form
      if (quotationId && !counterId) {
        // Direct quotation
        const token = idToken || await getIdToken(true);
        quotationData = await getQuotation(token, quotationId);
      } else if (counterId) {
        // Counter quotation - use the counter data
        quotationData = quotationOrCounter;
      } else {
        // Fallback to passed data
        quotationData = quotationOrCounter;
      }
      
      // Extract data with proper field name resolution
      const actualQuotation = quotationData.quotation || quotationData;
      const totalAmount = actualQuotation.total_amount || quotationOrCounter.total_amount || '';
      const deliveryDate = actualQuotation.expected_delivery_date || quotationOrCounter.expected_delivery_date || '';
      const advancePercent = actualQuotation.advance_payment_percent || quotationOrCounter.advance_payment_percent || '';
      
      // Format date if needed (convert to YYYY-MM-DD for input)
      let formattedDate = deliveryDate;
      if (deliveryDate) {
        try {
          const dateObj = new Date(deliveryDate);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Date formatting error:', e);
        }
      }
      
      // Pre-fill LOI form with quotation/counter details
      setLoiFormData({
        quotationId: String(quotationId || ''),
        counterQuotationId: String(counterId || ''),
        totalAmount: totalAmount,
        expectedDeliveryDate: formattedDate,
        termsAndConditions: '',
      });
      
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      // Fallback to basic data
      setLoiFormData({
        quotationId: String(quotationId || ''),
        counterQuotationId: String(counterId || ''),
        totalAmount: quotationOrCounter.total_amount || '',
        expectedDeliveryDate: quotationOrCounter.expected_delivery_date || '',
        termsAndConditions: '',
      });
    }
    
    // Navigate to LOI tab
    setCurrentPage('purchase-lois');
    
    // Set focus on the quotation/counter for auto-selection
    if (counterId) {
      setFocusCounterId(counterId);
    } else if (quotationId) {
      setFocusQuotationId(quotationId);
    }
  };

  const handleClearFocus = () => {
    setFocusQuotationId(null);
    setFocusCounterId(null);
    setFocusOrderId(null);
  };

  // LOI handlers
  const handleLoiInputChange = (e) => {
    const { name, value } = e.target;
    setLoiFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectQuotation = (quotationOrId) => {
    // Handle both quotation object and quotation ID string
    const quotationId = typeof quotationOrId === 'string' ? quotationOrId : (quotationOrId.quotation_id || quotationOrId.quotationId || '');
    const selectedQuotation = quotations.find(q => String(q.quotation_id) === String(quotationId));
    
    // Format date to YYYY-MM-DD for input type="date"
    let formattedDate = '';
    const deliveryDate = selectedQuotation?.expected_delivery_date;
    if (deliveryDate) {
      try {
        const dateObj = new Date(deliveryDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Date formatting error:', e);
      }
    }
    
    setLoiFormData(prev => ({
      ...prev,
      quotationId: quotationId,
      counterQuotationId: '',
      totalAmount: selectedQuotation?.total_amount || prev.totalAmount || '',
      expectedDeliveryDate: formattedDate || prev.expectedDeliveryDate || '',
    }));
  };

  const handleSelectCounter = (counterOrId) => {
    // Handle both counter object and counter ID string
    const counterId = typeof counterOrId === 'string' ? counterOrId : (counterOrId.counter_id || counterOrId.counterId || '');
    const selectedCounter = counters.find(c => String(c.counter_id) === String(counterId));
    
    setLoiFormData(prev => ({
      ...prev,
      counterQuotationId: counterId,
      quotationId: selectedCounter?.quotation_id || selectedCounter?.quotationId || prev.quotationId || '',
      totalAmount: selectedCounter?.total_amount || prev.totalAmount || '',
      expectedDeliveryDate: selectedCounter?.expected_delivery_date || prev.expectedDeliveryDate || '',
    }));
  };

  const handleSubmitLoi = async (e) => {
    e.preventDefault();
    
    try {
      const token = idToken || await getIdToken(true);
      
      const payload = {
        quotationId: loiFormData.quotationId,
        counterQuotationId: loiFormData.counterQuotationId || null,
        totalAmount: loiFormData.totalAmount,
        expectedDeliveryDate: loiFormData.expectedDeliveryDate,
        termsAndConditions: loiFormData.termsAndConditions,
      };

      if (editingLoiId) {
        // Update existing LOI
        await updateLoi(token, editingLoiId, payload);
        alert('LOI updated successfully');
      } else {
        // Create new LOI
        await createLoi(token, payload);
        alert('LOI created successfully');
      }

      // Refresh LOIs
      const data = await listLois(token);
      setLois(data.lois || data || []);
      
      setLoiFormData({
        quotationId: '',
        counterQuotationId: '',
        totalAmount: '',
        expectedDeliveryDate: '',
        termsAndConditions: '',
      });
      setEditingLoiId(null);
      
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to save LOI');
    }
  };

  const handleEditLoi = (loi) => {
    setEditingLoiId(loi.loi_id || loi.id);
    setLoiFormData({
      quotationId: loi.quotation_id || loi.quotationId || '',
      counterQuotationId: loi.counter_quotation_id || loi.counterQuotationId || '',
      totalAmount: loi.total_amount || loi.totalAmount || '',
      expectedDeliveryDate: loi.expected_delivery_date || loi.expectedDeliveryDate || '',
      termsAndConditions: loi.terms_and_conditions || loi.termsAndConditions || '',
    });
  };

  const handleResubmitLoi = async (loi) => {
    try {
      const token = idToken || await getIdToken(true);
      const loiId = loi.loi_id || loi.id;
      await resubmitLoi(token, loiId);

      // Refresh LOIs
      const data = await listLois(token);
      setLois(data.lois || data || []);
      
      alert('LOI resubmitted successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to resubmit LOI');
    }
  };

  const handleDeleteLoi = async (loi) => {
    if (!window.confirm('Delete this LOI?')) return;

    try {
      const token = idToken || await getIdToken(true);
      const loiId = loi.loi_id || loi.id;
      await deleteLoi(token, loiId);

      // Refresh LOIs
      const data = await listLois(token);
      setLois(data.lois || data || []);
      
      alert('LOI deleted successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to delete LOI');
    }
  };

  const handleGenerateOrder = async (loi) => {
    try {
      const token = idToken || await getIdToken(true);
      const loiId = loi.loi_id || loi.id;
      
      const payload = {
        loiId,
        vendorId: loi.vendor_id,
        quotationId: loi.quotation_id,
        counterQuotationId: loi.counter_quotation_id,
        totalAmount: loi.total_amount,
        expectedDeliveryDate: loi.expected_delivery_date,
        termsAndConditions: loi.terms_and_conditions,
      };
      
      await createOrder(token, payload);
      
      // Refresh orders
      const data = await listOrders(token);
      setOrders(data.orders || data || []);
      
      setCurrentPage('purchase-orders');
      alert('Purchase order generated successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to generate order');
    }
  };

  const handleGoToOrders = () => {
    setCurrentPage('purchase-orders');
  };
  
  // Invoice handlers
  const handleMarkInvoiceReceived = async (invoiceOrId) => {
    try {
      const token = idToken || await getIdToken(true);
      const invoiceId = typeof invoiceOrId === 'object'
        ? (invoiceOrId.invoice_id || invoiceOrId.id)
        : invoiceOrId;
      await markInvoiceReceived(token, invoiceId);
      
      // Refresh invoices
      const data = await listInvoices(token);
      setInvoices(data.invoices || data || []);
      
      alert('Invoice marked as received');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to mark invoice as received');
    }
  };
  
  const handleAcceptInvoice = async (invoiceOrId) => {
    try {
      const token = idToken || await getIdToken(true);
      const invoiceId = typeof invoiceOrId === 'object'
        ? (invoiceOrId.invoice_id || invoiceOrId.id)
        : invoiceOrId;
      await acceptInvoice(token, invoiceId);
      
      // Refresh invoices
      const data = await listInvoices(token);
      setInvoices(data.invoices || data || []);
      
      alert('Invoice accepted');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to accept invoice');
    }
  };
  
  const handleRejectInvoice = async (invoiceOrId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      const token = idToken || await getIdToken(true);
      const invoiceId = typeof invoiceOrId === 'object'
        ? (invoiceOrId.invoice_id || invoiceOrId.id)
        : invoiceOrId;
      await rejectInvoice(token, invoiceId, { reason });
      
      // Refresh invoices
      const data = await listInvoices(token);
      setInvoices(data.invoices || data || []);
      
      alert('Invoice rejected');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to reject invoice');
    }
  };
  
  const handleMarkInvoicePaid = async (invoiceOrId) => {
    try {
      const token = idToken || await getIdToken(true);
      const invoiceId = typeof invoiceOrId === 'object'
        ? (invoiceOrId.invoice_id || invoiceOrId.id)
        : invoiceOrId;
      await markInvoicePaid(token, invoiceId);
      
      // Refresh invoices
      const data = await listInvoices(token);
      setInvoices(data.invoices || data || []);
      
      alert('Invoice marked as paid');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to mark invoice as paid');
    }
  };

  const handleGoToPayments = (orderIdOrInvoice) => {
    const orderId = typeof orderIdOrInvoice === 'object'
      ? (orderIdOrInvoice.order_id || orderIdOrInvoice.orderId)
      : orderIdOrInvoice;

    // Pre-fill the payment form with the order ID
    setPaymentFormData({
      orderId: String(orderId || ''),
      phase: '',
      amount: '',
      paymentMode: '',
      dueDate: '',
      notes: '',
    });
    
    // Navigate to payments tab
    setCurrentPage('purchase-payments');
    
    // Set focus on the order for auto-selection
    if (orderId) {
      setFocusOrderId(orderId);
    }
  };
  
  const handleGoToInvoices = (order) => {
    setCurrentPage('vendor-invoices');
  };

  // Payment handlers
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePayment = async () => {
    try {
      const token = idToken || await getIdToken(true);
      
      const payload = {
        orderId: paymentFormData.orderId,
        phase: paymentFormData.phase,
        amount: parseFloat(paymentFormData.amount),
        paymentMode: paymentFormData.paymentMode,
        dueDate: paymentFormData.dueDate,
        notes: paymentFormData.notes || '',
      };
      
      await createPayment(token, payload);
      
      // Refresh payments
      const data = await listPayments(token);
      setPayments(data.payments || data || []);
      
      // Clear form
      setPaymentFormData({
        orderId: '',
        phase: '',
        amount: '',
        paymentMode: '',
        dueDate: '',
        notes: '',
      });
      
      alert('Payment created successfully');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to create payment');
    }
  };

  const handleCompletePayment = async (paymentOrId) => {
    try {
      const token = idToken || await getIdToken(true);
      const paymentId = typeof paymentOrId === 'object'
        ? (paymentOrId.payment_id || paymentOrId.id)
        : paymentOrId;
      await completePayment(token, paymentId);
      
      // Refresh payments
      const data = await listPayments(token);
      setPayments(data.payments || data || []);
      
      alert('Payment marked as completed');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to complete payment');
    }
  };

  const handleFailPayment = async (paymentOrId) => {
    try {
      const token = idToken || await getIdToken(true);
      const paymentId = typeof paymentOrId === 'object'
        ? (paymentOrId.payment_id || paymentOrId.id)
        : paymentOrId;
      await failPayment(token, paymentId);
      
      // Refresh payments
      const data = await listPayments(token);
      setPayments(data.payments || data || []);
      
      alert('Payment marked as failed');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to mark payment as failed');
    }
  };

  const TabComponent = tabComponents[currentPage] || OverviewTab;

  // Calculate notification counts
  const registrationsCount = registrations.filter(r => r.status === 'pending').length;
  const vendorProductsCount = vendorComponents.filter(c => c.status === 'pending').length;

  // Generate vendors list from approved registrations
  const vendorsList = registrations
    .filter(r => r.status === 'approved')
    .map(r => ({
      vendorId: r.vendor_id || r.vendorId,
      label: `${r.company_name || r.companyName || 'Vendor'} - ${r.contact_person || r.contactPerson || 'Contact'}`,
      companyName: r.company_name || r.companyName,
      contactPerson: r.contact_person || r.contactPerson,
      contactEmail: r.contact_email || r.contactEmail,
      contactPhone: r.contact_phone || r.contactPhone,
      businessType: r.business_type || r.businessType,
      address: r.address,
    }));
  
  // Generate vendor lookup object for easy vendor info retrieval
  const vendorLookup = registrations
    .filter(r => r.status === 'approved')
    .reduce((acc, r) => {
      const vendorId = r.vendor_id || r.vendorId;
      const vendorLabel = `${r.company_name || r.companyName || 'Vendor'} - ${r.contact_person || r.contactPerson || 'Contact'}`;
      if (vendorId) {
        acc[vendorId] = vendorLabel;
      }
      return acc;
    }, {});
  
  // Generate order lookup for invoice references
  const orderLookup = orders.reduce((acc, order) => {
    const orderId = order.order_id || order.id;
    if (orderId) {
      acc[orderId] = order.order_number || `Order ${orderId}`;
    }
    return acc;
  }, {});

  // Generate component lookups (ID/code/name -> display name)
  const componentLookup = [...vendorComponents, ...allComponents, ...productComponents].reduce((acc, comp) => {
    const componentId = comp.componentId || comp.component_id || comp.componentid || comp.id;
    const componentCode = comp.component_code || comp.componentCode;
    const componentName = comp.componentName || comp.component_name || comp.name;
    const displayName = componentName || componentCode || componentId;

    if (!displayName) return acc;

    if (componentId) {
      acc[String(componentId)] = displayName;
      acc[String(componentId).toLowerCase()] = displayName;
    }
    if (componentCode) {
      acc[String(componentCode)] = displayName;
      acc[String(componentCode).toLowerCase()] = displayName;
    }
    if (componentName) {
      acc[String(componentName)] = displayName;
      acc[String(componentName).toLowerCase()] = displayName;
    }

    return acc;
  }, {});

  // Build componentDetailsLookup from ALL vendorComponents AND all components from database
  const componentDetailsLookup = [...vendorComponents, ...allComponents, ...productComponents].reduce((acc, comp) => {
    // Get all possible ID variations (lowercase and camelCase)
    const componentId = comp.componentId || comp.component_id || comp.componentid;
    const componentName = comp.componentName || comp.component_name || comp.name;
    const componentCode = comp.component_code || comp.componentCode;
    const dbId = comp.id;
    
    // Store by all ID variations for maximum compatibility
    if (componentId) {
      acc[componentId] = comp;
      acc[componentId.toLowerCase()] = comp;
    }
    if (componentName) {
      acc[componentName] = comp;
    }
    if (componentCode) {
      acc[componentCode] = comp;
    }
    if (dbId) {
      acc[dbId] = comp;
    }
    
    // Also store by componentid (lowercase) if different
    if (comp.componentid && comp.componentid !== componentId) {
      acc[comp.componentid] = comp;
    }
    
    return acc;
  }, {});

  const productLookup = products.reduce((acc, prod) => {
    const key = prod.productId || prod.productid || prod.id;
    acc[key] = prod.title || prod.productTitle || prod.name;
    return acc;
  }, {});

  // Filter registrations
  const filteredRegistrations = registrationFilter
    ? registrations.filter(r => r.status === registrationFilter)
    : registrations;

  // Prepare user profile data
  const displayName = purchaseManager?.name || purchaseManager?.email || currentUser?.email || 'Purchase Manager';
  const displayEmail = purchaseManager?.email || currentUser?.email || '';

  if (authLoading || loading) {
    return (
      <DashboardLayout 
        userType="purchase_manager" 
        currentPage={currentPage}
        userName={displayName}
        userProfile={{
          name: displayName,
          role: 'Purchase Manager',
          email: displayEmail,
        }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      userType="purchase_manager" 
      currentPage={currentPage}
      userName={displayName}
      userProfile={{
        name: displayName,
        role: 'Purchase Manager',
        email: displayEmail,
      }}
      registrationsCount={registrationsCount}
      vendorProductsCount={vendorProductsCount}
    >
      <TabComponent 
        {...props}
        purchaseManager={purchaseManager}
        loading={loading}
        registrations={filteredRegistrations}
        filter={registrationFilter}
        onFilterChange={handleRegistrationFilterChange}
        onView={handleViewRegistration}
        onApprove={handleApproveRegistration}
        onReject={handleRejectRegistration}
        products={products}
        selectedProduct={selectedProduct}
        components={productComponents}
        vendorCounts={vendorCounts}
        autoSelectFirstComponent={autoSelectFirstComponent}
        onAutoSelectConsumed={() => setAutoSelectFirstComponent(false)}
        onSelectProduct={handleSelectProduct}
        onCreateProduct={handleCreateProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onActivateComponent={handleToggleComponentActive}
        onViewVendors={handleViewVendors}
        vendorComponents={vendorComponents}
        onRefresh={refreshVendorComponents}
        enquiries={enquiries}
        quotations={quotations}
        counters={counters}
        requests={requests}
        vendors={vendorsList}
        selectedItems={selectedItems}
        formData={formData}
        onInputChange={handleInputChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onItemChange={handleItemChange}
        onSubmit={handleSubmitEnquiry}
        onEditEnquiry={handleEditEnquiry}
        editingEnquiryId={editingEnquiryId}
        onCancelEdit={handleCancelEditEnquiry}
        onDeleteEnquiry={handleDeleteEnquiry}
        onRejectEnquiry={handleRejectEnquiryAction}
        onRaiseEnquiry={handleRaiseEnquiry}
        onAcceptQuotation={handleAcceptQuotation}
        onRequestNegotiation={handleRequestNegotiation}
        onAcceptCounter={handleAcceptCounter}
        onRejectCounter={handleRejectCounter}
        onGoToLois={handleGoToLois}
        onSubmitLoi={handleSubmitLoi}
        onClearFocus={handleClearFocus}
        focusQuotationId={focusQuotationId}
        focusCounterId={focusCounterId}
        loiFormData={loiFormData}
        onLoiInputChange={handleLoiInputChange}
        onSelectQuotation={handleSelectQuotation}
        onSelectCounter={handleSelectCounter}
        onLoiSubmit={handleSubmitLoi}
        onEditLoi={handleEditLoi}
        editingLoiId={editingLoiId}
        onResubmitLoi={handleResubmitLoi}
        onDeleteLoi={handleDeleteLoi}
        onGenerateOrder={handleGenerateOrder}
        onGoToOrders={handleGoToOrders}
        orders={orders}
        invoices={invoices}
        payments={payments}
        lois={lois}
        vendorLookup={vendorLookup}
        orderLookup={orderLookup}
        onMarkReceived={handleMarkInvoiceReceived}
        onAccept={handleAcceptInvoice}
        onRejectInvoice={handleRejectInvoice}
        onMarkPaid={handleMarkInvoicePaid}
        onGoToPayments={handleGoToPayments}
        onGoToInvoices={handleGoToInvoices}
        focusOrderId={focusOrderId}
        paymentFormData={paymentFormData}
        onPaymentInputChange={handlePaymentInputChange}
        onPaymentSubmit={handleCreatePayment}
        onComplete={handleCompletePayment}
        onFail={handleFailPayment}
        componentLookup={componentLookup}
        componentDetailsLookup={componentDetailsLookup}
        productLookup={productLookup}
        analytics={analytics}
        data={analytics}
        overviewStats={overviewStats}
        onGoToRegistrations={handleGoToRegistrations}
        onGoToVendorComponents={handleGoToVendorComponents}
        receipts={payments.filter(p => p.status === 'receipt_sent')}
      />
      
      <RegistrationDetailsModal
        selectedRegistration={selectedRegistration}
        onClose={handleCloseRegistrationModal}
        onApprove={handleApproveRegistration}
        onReject={() => handleRejectRegistration(selectedRegistration)}
      />
    </DashboardLayout>
  );
}

export default PurchaseManagerDashboard;
