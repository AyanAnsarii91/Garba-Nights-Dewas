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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.12),_transparent_35%),#efffff]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm lg:hidden"
            />

            <div className="fixed inset-y-0 left-0 z-50 w-72 p-4 lg:hidden">
              <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
            </div>
          </>
        )}

        <main className="min-w-0 flex-1">
          <AdminTopbar
            admin={admin}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
