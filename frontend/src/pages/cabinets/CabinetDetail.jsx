import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cabinetApi, quoteApi } from '../../lib/api';
import { Building2, MapPin, Mail, Phone, Globe, ArrowLeft, Send } from 'lucide-react';

export default function CabinetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isEntreprise = user?.role === 'entreprise';
  const [cabinet, setCabinet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    service: '',
    budget: '',
    timeline: '',
    description: '',
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  useEffect(() => {
    const fetchCabinet = async () => {
      try {
        const res = await cabinetApi.getById(id);
        setCabinet(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCabinet();
  }, [id]);

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteError(null);
    setQuoteLoading(true);
    try {
      await quoteApi.createQuote({
        cabinet: cabinet.user._id,
        ...quoteForm
      });
      setQuoteSuccess(true);
      setShowQuoteForm(false);
    } catch (err) {
      setQuoteError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleQuoteChange = (e) => {
    setQuoteForm({ ...quoteForm, [e.target.name]: e.target.value });
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
    </div>
  );

  if (error || !cabinet) return (
    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 max-w-2xl mx-auto mt-8">
      {error || 'Cabinet introuvable'}
      <button onClick={() => navigate('/cabinets')} className="mt-4 block text-red-700 underline">
        Retour à la liste
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate('/cabinets')} className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux cabinets
      </button>

      {quoteSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200">
          Votre demande de devis a été envoyée avec succès au cabinet !
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-primary-600 h-32 md:h-48 relative">
          <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white text-3xl font-bold text-primary-600">
            {cabinet.firmName ? cabinet.firmName.charAt(0).toUpperCase() : 'C'}
          </div>
        </div>
        
        <div className="pt-16 px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{cabinet.firmName}</h1>
              {cabinet.tagline && <p className="text-lg text-gray-600 mt-1">{cabinet.tagline}</p>}
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {cabinet.city || cabinet.address || 'Adresse non spécifiée'}</span>
                {cabinet.emailContact && <span className="flex items-center"><Mail className="w-4 h-4 mr-1" /> {cabinet.emailContact}</span>}
                {cabinet.phone && <span className="flex items-center"><Phone className="w-4 h-4 mr-1" /> {cabinet.phone}</span>}
                {cabinet.website && <span className="flex items-center"><Globe className="w-4 h-4 mr-1" /> {cabinet.website}</span>}
              </div>
            </div>
            
            {isEntreprise && (
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                  className="btn-primary items-center whitespace-nowrap px-5"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Demander un devis
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">À propos</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {cabinet.description || "Aucune description fournie par ce cabinet."}
            </p>
          </div>

          {cabinet.services && cabinet.services.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Services proposés</h2>
              <div className="flex flex-wrap gap-2">
                {cabinet.services.map((service, i) => (
                  <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showQuoteForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Demande de devis</h2>
          {quoteError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
              {quoteError}
            </div>
          )}
          <form onSubmit={handleQuoteSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service souhaité *</label>
              <input
                required
                name="service"
                type="text"
                className="input-field"
                placeholder="Ex: Tenue comptable, Bilan annuel..."
                value={quoteForm.service}
                onChange={handleQuoteChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (Optionnel)</label>
                <input
                  name="budget"
                  type="text"
                  className="input-field"
                  placeholder="Ex: 500 € / mois"
                  value={quoteForm.budget}
                  onChange={handleQuoteChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Délai (Optionnel)</label>
                <input
                  name="timeline"
                  type="text"
                  className="input-field"
                  placeholder="Ex: Dès que possible"
                  value={quoteForm.timeline}
                  onChange={handleQuoteChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description de votre besoin *</label>
              <textarea
                required
                name="description"
                rows="4"
                className="input-field resize-none"
                placeholder="Détaillez votre demande, la taille de votre entreprise, votre secteur d'activité..."
                value={quoteForm.description}
                onChange={handleQuoteChange}
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setShowQuoteForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={quoteLoading}
                className="btn-primary px-6"
              >
                {quoteLoading ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
