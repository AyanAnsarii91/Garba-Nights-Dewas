import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Checkout from "./pages/Checkout.jsx";
import Payment from "./pages/Payment.jsx";
import Ticket from "./pages/Ticket.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminPasses from "./pages/admin/AdminPasses.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminScanner from "./pages/admin/AdminScanner.jsx";
import AdminCheckins from "./pages/admin/AdminCheckins.jsx";

import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer */}
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/tickets/order/:orderId" element={<Ticket />} />
        <Route path="/ticket/:ticketNumber" element={<Ticket />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />

            <Route path="/admin/passes" element={<AdminPasses />} />

            <Route path="/admin/orders" element={<AdminOrders />} />

            <Route path="/admin/scanner" element={<AdminScanner />} />

            <Route path="/admin/checkins" element={<AdminCheckins />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
