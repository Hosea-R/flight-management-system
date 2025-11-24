import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Plane, 
  Users, 
  Building2, 
  LogOut, 
  Menu, 
  X,
  Monitor,
  Sparkles
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, activeAirportCode } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer le rôle effectif : si superadmin avec contexte actif, se comporter comme admin
  const effectiveRole = user?.role === 'superadmin' && activeAirportCode ? 'admin' : user?.role;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['superadmin', 'admin'] },
    { name: 'Vols', href: '/flights', icon: Plane, roles: ['admin'] },
    { name: 'Aéroports', href: '/airports', icon: Building2, roles: ['superadmin'] },
    { name: 'Compagnies', href: '/airlines', icon: Plane, roles: ['superadmin'] },
    { name: 'Utilisateurs', href: '/users', icon: Users, roles: ['superadmin'] },
    { name: 'Écrans Publics', href: '/public-displays', icon: Monitor, roles: ['superadmin', 'admin'] },
  ];

  const filteredNavigation = navigation.filter(item => item.roles.includes(effectiveRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo & Close */}
        <div className="flex items-center justify-between h-24 px-8">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="h-10 w-10 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">ADEMA</span>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-6 mb-6">
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm border border-slate-100">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 capitalize flex items-center gap-2 mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                  isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-blue-500 group-hover:scale-110'
                }`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto">
                    <div className="h-1.5 w-1.5 bg-white/50 rounded-full"></div>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 group border border-transparent hover:border-rose-100"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-30 lg:hidden flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-50"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">ADEMA</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
