import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  getCurrentAdmin,
  hasAdminToken,
  removeAdminToken,
} from "../../services/adminApi.js";

const AdminProtectedRoute = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async () => {
      if (!hasAdminToken()) {
        if (mounted) {
          setAuthenticated(false);
          setLoading(false);
        }

        return;
      }

      try {
        await getCurrentAdmin();

        if (mounted) {
          setAuthenticated(true);
        }
      } catch (error) {
        removeAdminToken();

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efffff]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />

          <p className="text-sm font-medium text-slate-500">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
