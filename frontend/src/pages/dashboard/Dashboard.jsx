import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import { Building2, Briefcase, FileText, Activity } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authApi.getMe();
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
      Erreur: {error}
    </div>
  );

  const { user, profile } = data;
  const isEntreprise = user.role === 'entreprise';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <span className="px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold flex items-center gap-2">
          {isEntreprise ? <Building2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
          {isEntreprise ? 'Espace Entreprise' : 'Espace Cabinet'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Bienvenue, {user.fullName} 👋</h2>
          <p className="text-gray-600 mb-4">
            {isEntreprise 
              ? "Prêt à trouver le cabinet d'expertise comptable idéal pour votre entreprise ?" 
              : "Gérez votre cabinet, vos documents et trouvez de nouveaux clients."}
          </p>
          <div className="bg-gray-50 p-4 rounded-xl inline-block">
            <p className="text-sm text-gray-500 font-medium">Structure</p>
            <p className="text-lg font-bold text-gray-900">
              {profile?.companyName || profile?.firmName || 'Non défini'}
            </p>
          </div>
        </div>

        {/* Stats / Quick actions */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-primary-100" />
            <h3 className="font-semibold text-lg">Activité</h3>
          </div>
          <p className="text-primary-100 text-sm mb-4">Votre compte est actif et prêt à l'emploi.</p>
          <button className="w-full bg-white/20 hover:bg-white/30 transition-colors py-2 rounded-lg font-medium backdrop-blur-sm">
            Voir le profil
          </button>
        </div>
      </div>
    </div>
  );
}
