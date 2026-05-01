import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderOpen, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#6366f1"/>
            <path d="M9 16L14 21L23 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>TaskForge</span>
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className={isActive('/dashboard')}>
            <LayoutDashboard size={18} />Dashboard
          </Link>
          <Link to="/projects" className={isActive('/projects')}>
            <FolderOpen size={18} />Projects
          </Link>
        </div>
        <div className="nav-user">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <span className="user-name-nav">{user?.name}</span>
          <button className="btn-icon" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
