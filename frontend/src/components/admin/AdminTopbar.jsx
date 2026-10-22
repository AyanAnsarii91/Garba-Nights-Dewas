import { CircleCheck, Menu } from "lucide-react";

const AdminTopbar = ({ admin, onMenuClick }) => {
  const adminName = admin?.name || "Administrator";

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-inner">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="admin-icon-button admin-menu-button"
            aria-label="Open admin navigation"
          >
            <Menu size={20} />
          </button>

          <div className="admin-greeting">
            <p>EVENT OPERATIONS</p>
            <h2>{adminName}</h2>
          </div>
        </div>

        <div className="admin-account">
          <span className="admin-live"><CircleCheck size={14} /> Live</span>
          <div className="admin-account-copy"><strong>{adminName}</strong><small>{admin?.role || "ADMIN"}</small></div>
          <div className="admin-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
