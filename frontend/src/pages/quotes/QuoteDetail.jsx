import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { quoteApi } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  ArrowLeft, Building2, Euro, CalendarDays, Clock, AlertCircle, CheckCircle2,
  Loader2, Send, Save, Trash2, Pencil, ShieldCheck, MessageSquare,
} from 'lucide-react';

const formatDateTime = (value) =>
  new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fieldClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [me] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const role = me?.role === 'cabinet' ? 'cabinet' : 'entreprise';
  const isEntreprise = role === 'entreprise';
  const accent = isEntreprise ? 'primary' : 'blue';

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [form, setForm] = useState({ service: '', budget: '', timeline: '', description: '' });

  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await quoteApi.getQuoteById(id);
      setQuote(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [quote?.messages?.length]);

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 3500);
  };

  const startEdit = () => {
    setForm({
      service: quote.service || '',
      budget: quote.budget || '',
      timeline: quote.timeline || '',
      description: quote.description || '',
    });
    setEditing(true);
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await quoteApi.updateQuote(id, form);
      await load();
      setEditing(false);
      flash('Demande de devis mise à jour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cette demande de devis ? Cette action est irréversible.')) return;
    setDeleting(true);
    setError(null);
    try {
      await quoteApi.deleteQuote(id);
      navigate('/quotes', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await quoteApi.sendMessage(id, body);
      setReply('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptTerms = async () => {
    setAccepting(true);
    setError(null);
    try {
      await quoteApi.acceptTerms(id);
      await load();
      flash('Vous avez accepté les conditions.');
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error || 'Demande introuvable.'}</span>
        </div>
        <Link to="/quotes" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour à mes demandes
        </Link>
      </div>
    );
  }

  const counterpart = isEntreprise
    ? { name: quote.cabinetProfile?.firmName || quote.cabinet?.fullName || 'Cabinet', roleLabel: 'Cabinet' }
    : { name: quote.entrepriseProfile?.companyName || quote.entreprise?.fullName || 'Entreprise', roleLabel: 'Entreprise' };

  const conversationOpen = quote.status === 'accepted' || quote.status === 'completed';
  const myTerms = quote.terms?.[role]?.accepted ?? false;
  const theirTerms = quote.terms?.[isEntreprise ? 'cabinet' : 'entreprise']?.accepted ?? false;
  const bothTerms = quote.terms?.bothAcceptedAt;
  const canAccept = quote.status === 'accepted' && !myTerms;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to="/quotes"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Retour à la liste
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isEntreprise ? 'bg-primary-50 text-primary-600' : 'bg-blue-50 text-blue-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{quote.service}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEntreprise ? `Envoyée à ${counterpart.name}` : `Reçue de ${counterpart.name}`}
            </p>
          </div>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-start">
          <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Modifier la demande</h2>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Service</label>
                  <input
                    type="text"
                    className={fieldClass}
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    required
                    minLength={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Budget</label>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Délai souhaité</label>
                    <input
                      type="text"
                      className={fieldClass}
                      value={form.timeline}
                      onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={5}
                    className={`${fieldClass} resize-none`}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    minLength={10}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-auto px-6 py-2 text-sm disabled:opacity-70 flex items-center"
                  >
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900">Votre demande</h2>
                <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{quote.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  {quote.budget && (
                    <span className="flex items-center"><Euro className="w-4 h-4 mr-1" /> Budget : {quote.budget}</span>
                  )}
                  {quote.timeline && (
                    <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1" /> Délai : {quote.timeline}</span>
                  )}
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {formatDateTime(quote.createdAt)}</span>
                </div>

                {isEntreprise && quote.status === 'pending' && (
                  <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                    <button
                      onClick={startEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center disabled:opacity-70"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> {deleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Conversation</h2>
              <span className="ml-2 text-xs text-gray-400">({quote.messages?.length || 0})</span>
            </div>

            {!conversationOpen ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
                La conversation sera ouverte dès que {isEntreprise ? 'le cabinet aura accepté' : 'vous aurez accepté'} cette demande.
              </p>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {quote.messages?.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun message pour l'instant. Lancez la conversation.</p>
                  ) : (
                    quote.messages.map((m) => {
                      const mine = m.authorRole === role;
                      const name = mine
                        ? 'Vous'
                        : m.authorRole === 'cabinet'
                          ? quote.cabinetProfile?.firmName || quote.cabinet?.fullName || 'Cabinet'
                          : quote.entrepriseProfile?.companyName || quote.entreprise?.fullName || 'Entreprise';
                      return (
                        <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] ${mine ? 'text-right' : ''}`}>
                            <p className="text-xs font-semibold text-gray-500 mb-1">{name}</p>
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm text-left whitespace-pre-wrap ${
                                mine
                                  ? isEntreprise
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {m.body}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(m.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                <form onSubmit={handleSend} className="mt-5 border-t border-gray-100 pt-5 space-y-3">
                  <textarea
                    rows={3}
                    className={`${fieldClass} resize-none`}
                    placeholder={`Répondre à ${counterpart.roleLabel.toLowerCase()}...`}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    maxLength={2000}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className={`px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-70 flex items-center ${
                        isEntreprise ? 'bg-primary-500 hover:bg-primary-600' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {sending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                      {sending ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {quote.response && (quote.response.price > 0 || quote.response.duration) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Proposition du cabinet</h2>
              {quote.response.price > 0 && (
                <p className="text-2xl font-bold text-gray-900">{quote.response.price} €</p>
              )}
              {quote.response.duration && (
                <p className="text-sm text-gray-600 mt-1">Durée : {quote.response.duration}</p>
              )}
              {quote.response.respondedAt && (
                <p className="text-xs text-gray-400 mt-3">Envoyée le {formatDateTime(quote.response.respondedAt)}</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-1">
              <ShieldCheck className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-sm font-semibold text-gray-700">Conditions</h2>
            </div>

            {bothTerms ? (
              <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <p className="font-medium">Conditions acceptées par les deux parties</p>
                <p className="text-xs mt-1">Le {formatDateTime(bothTerms)}</p>
              </div>
            ) : (
              <>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Vous</span>
                    {myTerms
                      ? <span className="inline-flex items-center text-green-600 font-medium"><CheckCircle2 className="w-4 h-4 mr-1" />Accepté</span>
                      : <span className="text-gray-400">En attente</span>}
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">{counterpart.roleLabel}</span>
                    {theirTerms
                      ? <span className="inline-flex items-center text-green-600 font-medium"><CheckCircle2 className="w-4 h-4 mr-1" />Accepté</span>
                      : <span className="text-gray-400">En attente</span>}
                  </li>
                </ul>

                {quote.status !== 'accepted' ? (
                  <p className="mt-4 text-xs text-gray-500">
                    Les conditions pourront être acceptées une fois la demande acceptée.
                  </p>
                ) : canAccept ? (
                  <button
                    onClick={handleAcceptTerms}
                    disabled={accepting}
                    className={`mt-4 w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-70 ${
                      isEntreprise ? 'bg-primary-500 hover:bg-primary-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {accepting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {accepting ? 'Enregistrement...' : 'Terms accepted'}
                  </button>
                ) : (
                  <p className="mt-4 text-xs text-gray-500">
                    Vous avez accepté. En attente de la confirmation de {counterpart.roleLabel.toLowerCase()}.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{counterpart.roleLabel}</h2>
            <p className="font-bold text-gray-900">{counterpart.name}</p>
            {counterpart.roleLabel === 'Cabinet' && quote.cabinetProfile?.city && (
              <p className="text-sm text-gray-500 mt-1">{quote.cabinetProfile.city}</p>
            )}
            {counterpart.roleLabel === 'Entreprise' && quote.entrepriseProfile?.city && (
              <p className="text-sm text-gray-500 mt-1">{quote.entrepriseProfile.city}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">Créée le {formatDateTime(quote.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
