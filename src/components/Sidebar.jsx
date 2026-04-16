import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/students', label: 'New Admission & Search' },
  { path: '/attendance', label: 'Classes' },
  { path: '/fees', label: 'Collect Fees' },
  { path: '/timetable', label: 'Timetable' },
  { path: '/messages', label: 'Messages' },
  { path: '/teacher-payments', label: 'Payroll' },
  { path: '/setup', label: 'Setup' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { school } = useSelector((state) => state.settings);

  const handleLogout = () => {
    dispatch(logout()).then(() => navigate('/login'));
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 bg-navy-900 border-r border-white/5
        ${isOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:w-16 lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {school?.logo ? <img src={school.logo} alt="Logo" className="w-full h-full object-contain p-1" /> : (school?.name?.charAt(0) || 'S')}
            </div>
            <div className={`overflow-hidden transition-all ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 lg:opacity-0 lg:w-0'}`}>
              <h1 className="font-semibold text-white text-sm whitespace-nowrap">{school?.name || 'School Manager'}</h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">{user?.role === 'superuser' ? 'Super Admin' : 'Management'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-2 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              onClick={() => window.innerWidth < 1024 && onToggle()}
            >
              <span className={`whitespace-nowrap transition-all ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition-all w-full"
          >
            <span className={`whitespace-nowrap transition-all ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
