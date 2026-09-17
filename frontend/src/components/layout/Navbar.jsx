import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { LogOut, User, Menu, X, Building2, Briefcase } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/login');
  };

  if (!user) return null; // Don't show navbar on public/auth pages if wanted

  const navLinks = user.role === 'entreprise' 
    ? [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Cabinets', path: '/cabinets' },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard' },
      ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Compta<span className="text-primary-500">Link</span>
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === link.path
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              to="/profile"
              className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              <User className="h-5 w-5 mr-1" />
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-5 w-5 mr-1" />
              Déconnexion
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/profile"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            >
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-500 hover:bg-red-50 hover:border-red-300"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
