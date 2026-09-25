import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, quoteApi } from '../../lib/api';
import { Building2, FileText, Clock, CheckCircle2, XCircle, TrendingUp, Users, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, quotesRes] = await Promise.all([
          authApi.getMe(),
          quoteApi.getMyQuotes(),
        ]);
        setUser(meRes.user);
        setProfile(meRes.profile);
        setQuotes(quotesRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  const pendingCount = quotes.filter((q) => q.status === 'pending').length;
  const acceptedCount = quotes.filter((q) => q.status === 'accepted').length;
  const declinedCount = quotes.filter((q) => q.status === 'declined').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.fullName || 'Utilisateur'}
        </h1>
        <p className="text-gray-600 mt-1">Voici un aperçu de votre activité.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              <p className="text-sm text-gray-500">Total devis</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{acceptedCount}</p>
              <p className="text-sm text-gray-500">Acceptés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{declinedCount}</p>
              <p className="text-sm text-gray-500">Refusés</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/quotes" className="btn-primary px-4 py-2 text-sm">
            Voir mes devis
          </Link>
          <Link to="/cabinets" className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
            Parcourir les cabinets
          </Link>
        </div>
      </div>
    </div>
  );
}
