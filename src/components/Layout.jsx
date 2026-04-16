import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import Sidebar from './Sidebar';
import { AccountInfoModal, ChangeEmailModal, ChangePasswordModal, ChangePhotoModal } from './ProfileModals';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace('/api', '');
  const dropdownRef = useRef(null);
  
  const [modals, setModals] = useState({
    info: false,
    email: false,
    password: false,
    photo: false
  });

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div 
        id="main-scroll-container"
        className={`transition-[margin] duration-300 h-screen overflow-y-auto overflow-x-hidden flex flex-col ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'}`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between bg-navy-900 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-900 transition-colors text-xl"
            >
              ☰
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Welcome back, {user?.name || 'User'}
              </h2>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md hover:scale-105 transition-all cursor-pointer overflow-hidden border-2 border-white/10"
            >
              {user?.photo ? (
                <img src={`${BASE_URL}/${user.photo}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-navy-800 rounded-xl shadow-2xl border border-white/5 py-2 z-50 animate-fade-in text-white">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => { setModals({ ...modals, info: true }); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Account Info
                </button>

                <button 
                  onClick={() => { setModals({ ...modals, photo: true }); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Change Photo
                </button>
                
                <button 
                  onClick={() => { setModals({ ...modals, email: true }); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> Change Email
                </button>
 
                <button 
                  onClick={() => { setModals({ ...modals, password: true }); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> Change Password
                </button>

                <div className="mt-2 pt-2 border-t border-white/5">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Profile Modals */}
      <AccountInfoModal 
        isOpen={modals.info} 
        onClose={() => setModals({ ...modals, info: false })} 
      />
      <ChangeEmailModal 
        isOpen={modals.email} 
        onClose={() => setModals({ ...modals, email: false })} 
      />
      <ChangePasswordModal 
        isOpen={modals.password} 
        onClose={() => setModals({ ...modals, password: false })} 
      />
      <ChangePhotoModal 
        isOpen={modals.photo} 
        onClose={() => setModals({ ...modals, photo: false })} 
      />
    </div>
  );
}
