import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
        <p className="text-gray-600 mb-6">
          Connecté en tant que <span className="font-semibold text-primary-600">{user.fullName || 'Utilisateur'}</span>
        </p>
        
        <div className="inline-flex items-center justify-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg mb-8 font-medium">
          Rôle : {user.role === 'entreprise' ? '🏢 Entreprise' : '💼 Cabinet'}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
