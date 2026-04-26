import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const roleNav = {
  restaurant: [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: '/donate',            icon: '🍱', label: 'Donate Food' },
    { to: '/my-donations',      icon: '📋', label: 'My Donations' },
    { to: '/rewards',           icon: '🏆', label: 'Rewards' },
    { to: '/impact',            icon: '📊', label: 'Impact' },
  ],
  college: [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: '/donate',            icon: '🍱', label: 'Donate Food' },
    { to: '/my-donations',      icon: '📋', label: 'My Donations' },
    { to: '/rewards',           icon: '🏆', label: 'Rewards' },
    { to: '/impact',            icon: '📊', label: 'Impact' },
  ],
  bakery: [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: '/donate',            icon: '🍱', label: 'Donate Food' },
    { to: '/my-donations',      icon: '📋', label: 'My Donations' },
    { to: '/rewards',           icon: '🏆', label: 'Rewards' },
    { to: '/impact',            icon: '📊', label: 'Impact' },
  ],
  ngo: [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: '/available-food',    icon: '🔍', label: 'Available Food' },
    { to: '/accepted',          icon: '✅', label: 'Accepted' },
    { to: '/impact',            icon: '📊', label: 'Impact' },
  ],
  volunteer: [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: '/missions',          icon: '🚴', label: 'Missions' },
    { to: '/my-missions',       icon: '📋', label: 'My Pickups' },
    { to: '/leaderboard',       icon: '🥇', label: 'Leaderboard' },
    { to: '/impact',            icon: '📊', label: 'Impact' },
  ],
  admin: [
    { to: '/dashboard',         icon: '🏠', label: 'Dashboard' },
    { to: '/admin/users',       icon: '👥', label: 'Users' },
    { to: '/admin/donations',   icon: '📦', label: 'Donations' },
    { to: '/impact',            icon: '📊', label: 'Impact' },
  ],
};

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || 'restaurant';
  const nav = roleNav[role] || roleNav.restaurant;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabel = {
    restaurant: 'Restaurant',
    college:    'College / Mess',
    bakery:     'Bakery / Event',
    ngo:        'NGO / Shelter',
    volunteer:  'Volunteer',
    admin:      'Admin',
  }[role] || role;

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-card/50 backdrop-blur-xl border-r border-surface-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌿</span>
          <div>
            <h1 className="font-bold text-brand-400 text-base leading-tight">RescueNet</h1>
            <p className="text-xs text-surface-muted">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-surface-border">
        <div className="glass px-3 py-3 mb-2">
          <p className="text-sm font-medium text-slate-200 truncate">{profile?.name || 'User'}</p>
          <p className="text-xs text-surface-muted truncate">{profile?.organization}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-brand-400 font-bold text-sm">{profile?.rewards?.points ?? 0}</span>
            <span className="text-xs text-surface-muted">pts</span>
            {profile?.rewards?.streak > 0 && (
              <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                🔥 {profile.rewards.streak}d
              </span>
            )}
          </div>
        </div>
        <button onClick={handleLogout} className="btn-danger w-full justify-center text-xs">
          Sign out
        </button>
      </div>
    </aside>
  );
}
