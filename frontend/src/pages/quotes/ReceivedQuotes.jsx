import { useEffect, useState } from 'react';
import { quoteApi } from '../../lib/api';
import { Inbox, Clock, CheckCircle2, XCircle, Ban, Building2, Euro, CalendarDays, AlertCircle } from 'lucide-react';

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

export default function ReceivedQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ status: 'accepted', price: '', duration: '', message: '' });

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

  const openRespond = (id) => {
    setOpenId(id);
    setError(null);
    setForm({ status: 'accepted', price: '', duration: '', message: '' });
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await quoteApi.respondToQuote(openId, {
        status: form.status,
        price: form.price ? Number(form.price) : undefined,
        duration: form.duration,
        message: form.message,
      });
      setOpenId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Demandes reçues</h1>
        <p className="text-gray-600 mt-1">Répondez aux demandes de devis des entreprises.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Inbox className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
          <p className="mt-1 text-sm text-gray-500">Vous n'avez pas encore reçu de demande de devis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div key={q._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {q.entrepriseProfile?.companyName || q.entreprise?.fullName || 'Entreprise'}
                    </h3>
                    <p className="text-sm text-blue-700 font-medium">{q.service}</p>
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
                  <p className="text-sm font-semibold text-gray-700 mb-1">Votre réponse</p>
                  {q.response.price > 0 && <p className="text-sm text-gray-600">Prix proposé : {q.response.price} €</p>}
                  {q.response.duration && <p className="text-sm text-gray-600">Durée : {q.response.duration}</p>}
                  {q.response.message && <p className="text-sm text-gray-600 mt-1">{q.response.message}</p>}
                </div>
              )}

              {q.status === 'pending' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => (openId === q._id ? setOpenId(null) : openRespond(q._id))}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {openId === q._id ? 'Fermer' : 'Répondre'}
                  </button>
                </div>
              )}

              {openId === q._id && (
                <form onSubmit={handleRespond} className="mt-5 border-t border-gray-100 pt-5 space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'accepted' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.status === 'accepted'
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'declined' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.status === 'declined'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Refuser
                    </button>
                  </div>

                  {form.status === 'accepted' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        min="0"
                        className="input-field"
                        placeholder="Prix proposé (€)"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Durée (ex: 3 mois)"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      />
                    </div>
                  )}

                  <textarea
                    rows="3"
                    className="input-field resize-none"
                    placeholder="Message pour l'entreprise..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  ></textarea>

                  <div className="flex justify-end">
                    <button type="submit" disabled={submitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70">
                      {submitting ? 'Envoi...' : 'Envoyer la réponse'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
