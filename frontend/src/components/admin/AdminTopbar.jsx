import { Bell, Menu } from "lucide-react";

const AdminTopbar = ({ admin, onMenuClick }) => {
  const adminName = admin?.name || "Administrator";

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 lg:px-6">
      <div className="flex min-h-20 items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/70 px-5 shadow-[0_15px_50px_rgba(15,118,110,0.08)] backdrop-blur-2xl lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div>
            <p className="text-xs font-medium text-slate-400">Welcome back</p>

            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {adminName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <Bell size={19} />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-500" />
          </button>

          <div className="hidden h-10 w-px bg-slate-200 sm:block" />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{adminName}</p>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {admin?.role || "ADMIN"}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
            {adminName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
