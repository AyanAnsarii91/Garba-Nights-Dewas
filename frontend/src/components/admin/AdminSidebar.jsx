import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  ShoppingBag,
  ScanLine,
  ClipboardCheck,
  LogOut,
  Sparkles,
  X,
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
          ? "flex h-full w-full shrink-0"
          : "hidden min-h-screen w-72 shrink-0 p-4 lg:flex"
      }
    >
      <div className="flex h-full min-h-0 w-full flex-col rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_70px_rgba(15,118,110,0.10)] backdrop-blur-2xl">
        {/* Brand */}
        <div className="flex items-center justify-between px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles size={21} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">
                GarbaPass
              </h1>

              <p className="text-xs font-medium text-slate-400">
                Admin Console
              </p>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-2">
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
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-cyan-50 text-cyan-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
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
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">
            Event
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            Garba Night 2026
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Booking system active
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
