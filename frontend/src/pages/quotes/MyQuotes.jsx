import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quoteApi } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  FileText, Clock, Euro, CalendarDays, AlertCircle, Pencil, Trash2, MessageSquare, X, Building2,
} from 'lucide-react';

export default function MyQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openReplyId, setOpenReplyId] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ service: '', budget: '', timeline: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const startEdit = (q) => {
    setEditingId(q._id);
    setError(null);
    setForm({
      service: q.service || '',
      budget: q.budget || '',
      timeline: q.timeline || '',
      description: q.description || '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await quoteApi.updateQuote(editingId, form);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm(`Supprimer définitivement la demande « ${q.service} » ? Cette action est irréversible.`)) return;
    setDeletingId(q._id);
    setError(null);
    try {
      await quoteApi.deleteQuote(q._id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await quoteApi.sendMessage(openReplyId, body);
      setReply('');
      setOpenReplyId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
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

              {editingId === q._id ? (
                <form onSubmit={handleSave} className="mt-4 border-t border-gray-100 pt-5 space-y-4">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Service"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    required
                    minLength={2}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Budget"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Délai souhaité"
                      value={form.timeline}
                      onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                    />
                  </div>
                  <textarea
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Description de votre besoin"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    minLength={10}
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-70"
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
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

                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <Link
                      to={`/quotes/${q._id}`}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" /> Voir la demande
                      {q.messages?.length > 0 && ` (${q.messages.length})`}
                    </Link>

                    {(q.status === 'accepted' || q.status === 'completed') && (
                      <button
                        onClick={() => (openReplyId === q._id ? setOpenReplyId(null) : (setOpenReplyId(q._id), setReply('')))}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors flex items-center"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {openReplyId === q._id ? 'Fermer' : 'Répondre'}
                      </button>
                    )}

                    {q.status === 'pending' && (
                      <>
                        <button
                          onClick={() => startEdit(q)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Modifier
                        </button>
                        <button
                          onClick={() => handleCancel(q._id)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <X className="w-4 h-4 mr-1" /> Annuler
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          disabled={deletingId === q._id}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center disabled:opacity-70"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deletingId === q._id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </>
                    )}
                  </div>

                  {openReplyId === q._id && (
                    <form
                      onSubmit={handleSendReply}
                      className="mt-4 border-t border-gray-100 pt-4 space-y-3"
                    >
                      <textarea
                        rows={3}
                        className="input-field resize-none"
                        placeholder="Répondre au cabinet..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        maxLength={2000}
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={sending || !reply.trim()}
                          className="px-6 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-70"
                        >
                          {sending ? 'Envoi...' : 'Envoyer le message'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
