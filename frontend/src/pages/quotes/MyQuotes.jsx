import { useEffect, useState } from 'react';
import { quoteApi } from '../../lib/api';
import { FileText, Clock, CheckCircle2, XCircle, Ban, Building2, Euro, CalendarDays, AlertCircle } from 'lucide-react';

const STATUS = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  accepted: { label: 'Acceptée', className: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 },
  declined: { label: 'Refusée', className: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  completed: { label: 'Terminée', className: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CheckCircle2 },
  cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-600 border-gray-200', Icon: Ban },
};

function StatusBadge({ status }) {
  const config = STATUS[status] || STATUS.pending;
  const { Icon } = config;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
    </span>
  );
}

export default function MyQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await quoteApi.getMyQuotes();
      setQuotes(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    try {
      await quoteApi.cancelQuote(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes demandes de devis</h1>
        <p className="text-gray-600 mt-1">Suivez l'état de vos demandes envoyées aux cabinets.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
          <p className="mt-1 text-sm text-gray-500">Vous n'avez pas encore envoyé de demande de devis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div key={q._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {q.cabinetProfile?.firmName || q.cabinet?.fullName || 'Cabinet'}
                    </h3>
                    <p className="text-sm text-primary-700 font-medium">{q.service}</p>
                  </div>
                </div>
                <StatusBadge status={q.status} />
              </div>

              <p className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">{q.description}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                {q.budget && (
                  <span className="flex items-center">
                    <Euro className="w-4 h-4 mr-1" /> Budget : {q.budget}
                  </span>
                )}
                {q.timeline && (
                  <span className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1" /> Délai : {q.timeline}
                  </span>
                )}
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> {new Date(q.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {q.response && (q.response.price > 0 || q.response.message || q.response.duration) && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Réponse du cabinet</p>
                  {q.response.price > 0 && <p className="text-sm text-gray-600">Prix proposé : {q.response.price} €</p>}
                  {q.response.duration && <p className="text-sm text-gray-600">Durée : {q.response.duration}</p>}
                  {q.response.message && <p className="text-sm text-gray-600 mt-1">{q.response.message}</p>}
                </div>
              )}

              {q.status === 'pending' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleCancel(q._id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Annuler la demande
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
