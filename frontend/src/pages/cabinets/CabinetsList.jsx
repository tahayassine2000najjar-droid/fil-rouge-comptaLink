import { useEffect, useState } from 'react';
import { cabinetApi } from '../../lib/api';
import { Search, MapPin, Star, Building } from 'lucide-react';

export default function CabinetsList() {
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCabinets = async () => {
      try {
        const res = await cabinetApi.getAll();
        setCabinets(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCabinets();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cabinets Comptables</h1>
          <p className="text-gray-600 mt-1">Trouvez l'expert comptable idéal pour votre entreprise.</p>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors shadow-sm"
            placeholder="Rechercher un cabinet..."
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      ) : cabinets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Building className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun cabinet</h3>
          <p className="mt-1 text-sm text-gray-500">Aucun cabinet n'est inscrit pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cabinets.map((cab) => (
            <div key={cab._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold text-xl group-hover:scale-110 transition-transform">
                    {cab.firmName.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex items-center text-sm font-medium text-amber-500 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Nouveau
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{cab.firmName}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {cab.description || 'Cabinet d\'expertise comptable professionnel et à votre écoute.'}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-6">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {cab.address || 'Adresse non spécifiée'}
                </div>
                <button className="w-full btn-primary py-2.5 shadow-none hover:shadow-none hover:bg-primary-600">
                  Voir le profil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
