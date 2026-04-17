import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Seller pages
import Layout      from './components/Layout';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Sales       from './pages/Sales';
import Customers   from './pages/Customers';
import AIInsights  from './pages/AIInsights';
import Settings    from './pages/Settings';
import Chat        from './pages/Chat';
import Inventory   from './pages/Inventory';
import Orders      from './pages/Orders';

// Consumer pages
import ShopsList       from './pages/consumer/ShopsList';
import ShopPage        from './pages/consumer/ShopPage';
import ConsumerOrders  from './pages/consumer/ConsumerOrders';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) {
    // Wrong role — redirect to their home
    return <Navigate to={user?.role === 'consumer' ? '/consumer' : '/'} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={user?.role === 'consumer' ? '/consumer' : '/'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* ── SELLER routes (role: seller) ────────────── */}
      <Route path="/" element={<ProtectedRoute requiredRole="seller"><Layout /></ProtectedRoute>}>
        <Route index              element={<Dashboard  />} />
        <Route path="sales"       element={<Sales      />} />
        <Route path="customers"   element={<Customers  />} />
        <Route path="ai-insights" element={<AIInsights />} />
        <Route path="chat"        element={<Chat       />} />
        <Route path="inventory"   element={<Inventory  />} />
        <Route path="orders"      element={<Orders     />} />
        <Route path="settings"    element={<Settings   />} />
      </Route>

      {/* ── CONSUMER routes (role: consumer) ────────── */}
      <Route path="/consumer" element={<ProtectedRoute requiredRole="consumer"><ShopsList /></ProtectedRoute>} />
      <Route path="/consumer/shop/:shopId" element={<ProtectedRoute requiredRole="consumer"><ShopPage /></ProtectedRoute>} />
      <Route path="/consumer/orders"       element={<ProtectedRoute requiredRole="consumer"><ConsumerOrders /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
