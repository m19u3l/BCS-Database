import React, { useState, useEffect, useMemo, useRef } from 'react';
// Updated Lucide Imports: Added Search, Edit, Trash2, Mail, Phone, MapPin for the Client View
import { Home, Users, Hammer, FileText, DollarSign, Plus, AlertTriangle, TrendingUp, HardHat, FileEdit, Building2, Wrench, Package, ClipboardList, Briefcase, BarChart3, Bell, Settings, UserCheck, Truck, Search, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';

// --- FIXED: MODULAR FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot, serverTimestamp, deleteDoc, updateDoc, getDocs, where, addDoc, setLogLevel } from 'firebase/firestore';

// Set Firebase logging level for debugging (optional, but good practice)
setLogLevel('Debug');

const BCSCompleteSystem = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Firebase States ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // Gates data fetching

  // State for all data collections
  const [clients, setClients] = useState([]);
  // Adding mock fields to ensure dashboard tables have something to display initially
  const [invoices, setInvoices] = useState([
    { id: 'mock-i-1', invoiceNumber: 'INV-001', clientName: 'Smith Residence', total: 4500.00, status: 'Outstanding', createdAt: { toDate: () => new Date(Date.now() - 86400000) } },
    { id: 'mock-i-2', invoiceNumber: 'INV-002', clientName: 'Acme Corp Office', total: 12500.00, status: 'Paid', createdAt: { toDate: () => new Date(Date.now() - 2 * 86400000) } },
  ]);
  const [workOrders, setWorkOrders] = useState([
    { id: 'mock-w-1', workOrderNumber: 'WO-005', projectName: 'Brown Kitchen Remodel', status: 'in-progress', endDate: { toDate: () => new Date(Date.now() + 5 * 86400000) } },
    { id: 'mock-w-2', workOrderNumber: 'WO-004', projectName: 'Johnson Roof Repair', status: 'completed', endDate: { toDate: () => new Date(Date.now() - 3 * 86400000) } },
  ]);
  const [changeOrders, setChangeOrders] = useState([
    { id: 'mock-c-1', status: 'pending', cost_change: 500 },
    { id: 'mock-c-2', status: 'approved', cost_change: 200 },
  ]);
  const [employees, setEmployees] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [priceList, setPriceList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [settings, setSettings] = useState({});

  // --- Utility Functions ---

  // Helper for generating firestore paths
  const getCollectionRef = (collectionName, isPublic = false) => {
    if (!db || !userId) return null;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (isPublic) {
      // Public data path: /artifacts/{appId}/public/data/{collectionName}
      return collection(db, 'artifacts', appId, 'public', 'data', collectionName);
    } else {
      // Private data path: /artifacts/{appId}/users/{userId}/{collectionName}
      return collection(db, 'artifacts', appId, 'users', userId, collectionName);
    }
  };

  const handleError = (error, message) => {
    console.error(message, error);
    // In a real app, you would show a user-facing error message here
  };


  // --- EFFECT: FIREBASE INITIALIZATION & AUTHENTICATION ---
  useEffect(() => {
    try {
      const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
      if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        throw new Error("Firebase config is missing or empty.");
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // If no user is logged in, use the custom token if available
          const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          if (initialAuthToken) {
            try {
              await signInWithCustomToken(authInstance, initialAuthToken);
            } catch (error) {
              // Fallback to anonymous sign-in if custom token fails
              await signInAnonymously(authInstance);
              setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
            }
          } else {
             // Fallback to anonymous sign-in if no token is available
            await signInAnonymously(authInstance);
            setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
          }
        }
        setIsAuthReady(true);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      handleError(error, "Firebase initialization failed.");
      setLoading(false);
      // Fallback for environment setup issues
      setIsAuthReady(true); 
    }
  }, []);

  // --- EFFECT: DATA SUBSCRIPTIONS (Firestore onSnapshot) ---
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const collectionsToListen = [
      { name: 'clients', setter: setClients },
      // Note: In a real app, we would only fetch real data and remove mocks above.
      { name: 'invoices', setter: setInvoices },
      { name: 'workOrders', setter: setWorkOrders },
      { name: 'changeOrders', setter: setChangeOrders },
      { name: 'employees', setter: setEmployees },
      { name: 'equipment', setter: setEquipment },
      { name: 'materials', setter: setMaterials },
      { name: 'priceList', setter: setPriceList, isPublic: true },
      { name: 'vendors', setter: setVendors },
    ];

    const unsubscribes = collectionsToListen.map(({ name, setter, isPublic = false }) => {
      const ref = getCollectionRef(name, isPublic);
      if (!ref) return () => {};

      return onSnapshot(query(ref), (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setter(data);
      }, (error) => handleError(error, `Error fetching ${name}`));
    });

    // Fetch settings (private, single document)
    const settingsRef = doc(getCollectionRef('settings'), 'config');
    const settingsUnsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Initialize default settings if missing
        setSettings({
          companyName: 'BCS Construction Services',
          taxRate: 0.08,
          defaultCurrency: 'USD',
          createdAt: serverTimestamp(),
        });
        setDoc(settingsRef, {
          companyName: 'BCS Construction Services',
          taxRate: 0.08,
          defaultCurrency: 'USD',
          createdAt: serverTimestamp(),
        }, { merge: true }).catch(e => console.error("Error creating default settings: ", e));
      }
    }, (error) => handleError(error, 'Error fetching settings'));
    
    unsubscribes.push(settingsUnsubscribe);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db, userId, isAuthReady]); // Re-run effect when Firebase state is ready

  // --- Mock Data/Calculations for Dashboard ---
  const dashboardStats = useMemo(() => {
    // Total Invoiced from ALL items (mocked and real)
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    // Completed Work Orders from ALL items
    const projectsCompleted = workOrders.filter(wo => wo.status === 'completed').length;
    // Pending Change Orders from ALL items
    const pendingChangeOrders = changeOrders.filter(co => co.status === 'pending').length;
    // Active Work Orders from ALL items
    const activeWorkOrders = workOrders.filter(wo => wo.status === 'in-progress').length;

    return {
      totalInvoiced,
      projectsCompleted,
      pendingChangeOrders,
      activeWorkOrders,
    };
  }, [invoices, workOrders, changeOrders]);
  
  // Safe function to get data length for placeholder views
  const getDataLength = (view) => {
    switch (view) {
      case 'clients': return clients.length;
      case 'invoices': return invoices.length;
      case 'workOrders': return workOrders.length;
      case 'changeOrders': return changeOrders.length;
      case 'employees': return employees.length;
      case 'equipment': return equipment.length;
      case 'materials': return materials.length;
      case 'priceList': return priceList.length;
      case 'vendors': return vendors.length;
      default: return 0;
    }
  };
  
  // --- CLIENTS VIEW LOGIC (Filtering) ---

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name?.toLowerCase().includes(lowerCaseSearch) ||
      client.email?.toLowerCase().includes(lowerCaseSearch) ||
      client.phone?.toLowerCase().includes(lowerCaseSearch) ||
      client.address?.toLowerCase().includes(lowerCaseSearch) ||
      client.city?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [clients, searchTerm]);

  // --- Placeholder CRUD Handlers (for Clients) ---
  const handleEdit = (client) => {
    console.log('Editing client:', client);
    setEditingItem(client);
    setModalType('editClient');
    setShowModal(true);
  };
  
  // NOTE: Replacing window.confirm() with a console log to adhere to the rule of not using alert/confirm
  const handleDelete = async (client) => {
    console.log(`Attempting to delete client ${client.name} (ID: ${client.id}). We will add a proper confirmation modal later.`);
    
    // Simulate Confirmation Check
    // In a future step, this will be replaced by showing a custom modal.
    const isConfirmed = true; 
    
    if (!isConfirmed) return;
    
    try {
        const clientRef = doc(getCollectionRef('clients'), client.id);
        await deleteDoc(clientRef);
        // Success feedback will come automatically from onSnapshot update
        console.log(`Client ${client.name} deleted successfully.`);
    } catch (error) {
        handleError(error, 'Failed to delete client.');
    }
  };


  // --- Components ---

  const StatCard = ({ icon: Icon, title, value, description, colorClass = 'bg-white', textColor = 'text-gray-800' }) => (
    <div className={`p-6 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] ${colorClass} ${textColor} transform`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        <Icon className="w-8 h-8 opacity-75" />
      </div>
      <div className="mt-4">
        <p className="text-4xl font-extrabold">{value}</p>
        <p className="mt-1 text-sm opacity-80">{description}</p>
      </div>
    </div>
  );
  
  // --- NEW: Status Badge Component ---
  const StatusBadge = ({ status }) => {
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    let color = 'bg-gray-200 text-gray-800';
    if (status.toLowerCase().includes('completed') || status.toLowerCase().includes('paid')) {
      color = 'bg-green-100 text-green-800';
    } else if (status.toLowerCase().includes('progress') || status.toLowerCase().includes('outstanding')) {
      color = 'bg-blue-100 text-blue-800';
    } else if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('draft')) {
      color = 'bg-yellow-100 text-yellow-800';
    }
    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium uppercase ${color}`}>
        {statusText}
      </span>
    );
  };


  const DashboardView = ({ stats }) => {
    
    // Utility function for currency formatting
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.defaultCurrency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };
    
    // Utility function for date formatting (handles Firestore Timestamps)
    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      // Check if it's a Firestore Timestamp object with a toDate method
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      // If it's a standard JS date object or string, attempt to format
      try {
        return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return 'N/A';
      }
    };


    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 border-b-4 border-blue-500 pb-3">
          {settings.companyName || 'BCS Complete System'}
        </h1>
        <p className="text-lg text-gray-600">
            Welcome, **User** (ID: {userId || 'N/A'}). Use the navigation to manage your construction operations.
        </p>

        {/* --- Stat Cards (With Color) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Total Invoiced (YTD)"
            value={formatCurrency(stats.totalInvoiced)}
            description="All invoices created this year."
            colorClass="bg-blue-600 hover:bg-blue-700"
            textColor="text-white"
          />
          <StatCard
            icon={TrendingUp}
            title="Completed Projects"
            value={stats.projectsCompleted}
            description="Total projects marked 'Completed'."
            colorClass="bg-green-600 hover:bg-green-700"
            textColor="text-white"
          />
          <StatCard
            icon={AlertTriangle}
            title="Pending Change Orders"
            value={stats.pendingChangeOrders}
            description="Change orders requiring client approval."
            colorClass="bg-amber-500 hover:bg-amber-600"
            textColor="text-white"
          />
          <StatCard
            icon={Hammer}
            title="Active Work Orders"
            value={stats.activeWorkOrders}
            description="Projects currently in progress."
            colorClass="bg-red-500 hover:bg-red-600"
            textColor="text-white"
          />
        </div>
        
        {/* --- Quick Actions --- */}
        <div className="pt-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <QuickActionButton icon={Plus} label="New Client" onClick={() => { setActiveView('clients'); setModalType('addClient'); setShowModal(true); }} />
            <QuickActionButton icon={FileText} label="Create Invoice" onClick={() => setActiveView('invoices')} />
            <QuickActionButton icon={HardHat} label="Start Work Order" onClick={() => setActiveView('workOrders')} />
            <QuickActionButton icon={FileEdit} label="Add Change Order" onClick={() => setActiveView('changeOrders')} />
          </div>
        </div>

        {/* --- Summary Tables (Real-Time Data Display) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <SummaryTable 
            title="Recent Invoices" 
            data={invoices.slice(0, 5).map(i => ({ 
              id: i.invoiceNumber || i.id.substring(0, 4), 
              client: i.clientName || 'Unknown Client', 
              amount: formatCurrency(i.total || 0), 
              status: i.status || 'Draft'
            }))} 
            headers={['ID', 'Client', 'Amount', 'Status']} 
            formatValue={(key, value, item) => 
                key === 'status' ? <StatusBadge status={value} /> : value
            }
          />
          <SummaryTable 
            title="Upcoming Work Orders" 
            data={workOrders.slice(0, 5).map(wo => ({ 
              id: wo.workOrderNumber || wo.id.substring(0, 4), 
              project: wo.projectName, 
              date: formatDate(wo.endDate || wo.createdAt), 
              status: wo.status
            }))} 
            headers={['ID', 'Project', 'End Date', 'Status']} 
            formatValue={(key, value, item) => 
                key === 'status' ? <StatusBadge status={value} /> : value
            }
          />
        </div>

      </div>
    );
  };
  
  const QuickActionButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center px-4 py-3 bg-white text-blue-600 border border-blue-600 rounded-xl shadow-md hover:bg-blue-50 hover:shadow-lg transition duration-150 ease-in-out font-medium"
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </button>
  );

  // --- SummaryTable component enhanced to handle custom formatting ---
  const SummaryTable = ({ title, data, headers, formatValue = (key, value) => value }) => (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length > 0 ? data.map((item, index) => {
              // Extract values based on the order of the headers (assumes keys match headers)
              const itemKeys = Object.keys(item);
              return (
                <tr key={item.id || index}>
                  {itemKeys.map((key, i) => (
                    <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(key, item[key], item)}
                    </td>
                  ))}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // --- CLIENTS VIEW COMPONENT (READ functionality) ---
  const ClientsView = () => {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-xl min-h-[600px]">
        
        <h1 className="text-4xl font-extrabold text-gray-900 border-b-4 border-blue-500 pb-3">
          Client Management
        </h1>
        <p className="text-lg text-gray-600 mt-2">Manage customer contact and project information in real-time. ({filteredClients.length} clients found)</p>

        {/* Controls: Search and Add Button */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Search Bar */}
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name, Email, or Address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm"
            />
          </div>
          {/* Add Button */}
          <button
            onClick={() => { setModalType('addClient'); setShowModal(true); setEditingItem(null); }}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition duration-150 font-medium transform hover:scale-[1.02] active:scale-100"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Client
          </button>
        </div>

        {/* Client Table */}
        <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell"><Mail className="inline w-4 h-4 mr-1 text-blue-500"/> Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell"><Phone className="inline w-4 h-4 mr-1 text-green-500"/> Phone</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell"><MapPin className="inline w-4 h-4 mr-1 text-red-500"/> Location</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredClients.length > 0 ? filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                    {client.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                    {client.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                    {client.city ? `${client.city}, ${client.state || ''}` : client.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => handleEdit(client)}
                        className="p-2 text-blue-600 rounded-full hover:bg-blue-100 transition duration-150"
                        title="Edit Client"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(client)}
                        className="p-2 text-red-600 rounded-full hover:bg-red-100 transition duration-150"
                        title="Delete Client"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-lg text-gray-500">
                    No clients found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  const renderView = () => {
    if (loading) return <LoadingSpinner />;
    
    switch (activeView) {
      case 'dashboard':
        return <DashboardView stats={dashboardStats} />;
      case 'clients':
        return <ClientsView />; 
      // --- Placeholder Views for other sections ---
      case 'invoices':
      case 'workOrders':
      case 'changeOrders':
      case 'employees':
      case 'equipment':
      case 'materials':
      case 'priceList':
      case 'vendors':
      case 'reports':
      case 'notifications':
      case 'settings':
        return (
            <div className="p-8 bg-white rounded-xl shadow-lg">
                <h1 className="text-4xl font-bold text-gray-800">
                    {activeView.charAt(0).toUpperCase() + activeView.slice(1)} Management
                </h1>
                <p className="mt-4 text-gray-600">
                    This section is under construction. Data for **{activeView}** is being fetched in real-time ({getDataLength(activeView)} records found) and will be displayed here soon.
                </p>
            </div>
        );
      default:
        return <DashboardView stats={dashboardStats} />;
    }
  };
  
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full w-full">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-700">Connecting to Firestore...</p>
    </div>
  );


  return (
    // Main container with a light gray background for contrast
    <div className="min-h-screen bg-gray-100 flex font-sans">
      
      {/* Sidebar (Dark) */}
      <aside className="w-20 md:w-64 flex-shrink-0 bg-gray-900 shadow-2xl transition-all duration-300 ease-in-out border-r border-gray-800">
        <div className="p-4 flex items-center justify-center md:justify-start h-20 border-b border-gray-800">
          <Building2 className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <h2 className="hidden md:block ml-3 text-xl font-bold text-white">BCS System</h2>
        </div>
        
        <p className="hidden md:block text-xs font-semibold uppercase text-gray-500 pt-4 px-4 pb-2 border-b border-gray-800/50">
            Navigation
        </p>
        
        <nav className="p-2 space-y-2">
          {[
            { name: 'Dashboard', icon: Home, view: 'dashboard' },
            { name: 'Clients', icon: Users, view: 'clients' },
            { name: 'Invoices', icon: DollarSign, view: 'invoices' },
            // Using Wrench for Work Orders
            { name: 'Work Orders', icon: Wrench, view: 'workOrders' },
            { name: 'Change Orders', icon: FileEdit, view: 'changeOrders' },
            { name: 'Employees', icon: UserCheck, view: 'employees' },
            { name: 'Equipment', icon: Truck, view: 'equipment' },
            { name: 'Materials', icon: Package, view: 'materials' },
            { name: 'Price List', icon: ClipboardList, view: 'priceList' },
            { name: 'Vendors', icon: Briefcase, view: 'vendors' },
            { name: 'Reports', icon: BarChart3, view: 'reports' },
            { name: 'Notifications', icon: Bell, view: 'notifications' },
            { name: 'Settings', icon: Settings, view: 'settings' },
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex items-center w-full p-3 rounded-xl transition duration-150 ease-in-out ${
                activeView === item.view
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-blue-400'
              }`}
              title={item.name}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className="hidden md:block ml-4 font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full md:w-auto">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default BCSCompleteSystem;
