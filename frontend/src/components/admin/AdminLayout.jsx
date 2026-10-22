import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar.jsx";
import AdminTopbar from "./AdminTopbar.jsx";
import { getCurrentAdmin } from "../../services/adminApi.js";

const AdminLayout = () => {
  const [admin, setAdmin] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const response = await getCurrentAdmin();

        setAdmin(response?.data?.admin || null);
      } catch (error) {
        console.error("Unable to load admin profile:", error);
      }
    };

    loadAdmin();
  }, []);

  return (
    <div className="admin-app">
      <div className="admin-layout">
        <AdminSidebar />

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setMobileMenuOpen(false)}
              className="admin-drawer-scrim"
            />

            <div className="admin-mobile-drawer">
              <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
            </div>
          </>
        )}

        <main className="admin-main">
          <AdminTopbar
            admin={admin}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
