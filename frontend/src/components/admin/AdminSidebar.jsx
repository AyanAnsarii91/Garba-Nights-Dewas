import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  ShoppingBag,
  ScanLine,
  ClipboardCheck,
  LogOut,
  X,
  Share2,
} from "lucide-react";

import { removeAdminToken } from "../../services/adminApi.js";

const navigation = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Passes",
    to: "/admin/passes",
    icon: Ticket,
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Scanner",
    to: "/admin/scanner",
    icon: ScanLine,
  },
  {
    label: "Check-ins",
    to: "/admin/checkins",
    icon: ClipboardCheck,
  },
  {
    label: "Referrals",
    to: "/admin/referrals",
    icon: Share2,
  },
];

const AdminSidebar = ({ mobile = false, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAdminToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside
      className={
        mobile
          ? "admin-sidebar-wrap is-mobile"
          : "admin-sidebar-wrap is-desktop"
      }
    >
      <div className="admin-sidebar-surface">
        {/* Brand */}
        <div className="flex items-center justify-between px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="admin-brand-mark">
              <Ticket size={20} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="admin-brand-name">
                Dholki Nights
              </h1>

              <p className="admin-brand-caption">
                Admin Console
              </p>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={onClose}
                className="admin-icon-button"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    "admin-nav-link",
                    isActive
                      ? "is-active"
                      : "",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Event card */}
        <div className="admin-workspace-note">
          <p>EVENT WORKSPACE</p>
          <strong>Bookings &amp; entry</strong>
          <span><i /> Admin tools ready</span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="admin-logout"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
