import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import {
  Save, User, Building, Phone, MapPin, Mail, CalendarDays,
  Loader2, AlertCircle, CheckCircle2, Pencil, X,
} from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [role, setRole] = useState(null);
  const [view, setView] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    companyName: '', // For entreprise
    firmName: '',    // For cabinet
    description: '',
  });

  const toView = (user, profile) => ({
    fullName: user.fullName || '',
    email: user.email || '',
    memberSince: user.createdAt,
    companyName: profile?.companyName || '',
    firmName: profile?.firmName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    description: profile?.description || '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        const { user, profile } = res;
        setRole(user.role);
        setView(toView(user, profile));
        setFormData({
          fullName: user.fullName || '',
          phone: profile?.phone || '',
          address: profile?.address || '',
          city: profile?.city || '',
          companyName: profile?.companyName || '',
          firmName: profile?.firmName || '',
          description: profile?.description || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // The backend expects { fullName, profile: { ... } }
      const updateData = {
        fullName: formData.fullName,
        profile: {
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          description: formData.description,
          ...(role === 'entreprise' ? { companyName: formData.companyName } : { firmName: formData.firmName }),
        }
      };

      await authApi.updateMe(updateData);

      // Update local storage user name
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.fullName = formData.fullName;
      localStorage.setItem('user', JSON.stringify(storedUser));

      setView((prev) => ({
        ...prev,
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        description: formData.description,
        ...(role === 'entreprise'
          ? { companyName: formData.companyName }
          : { firmName: formData.firmName }),
      }));

      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  const companyValue = role === 'entreprise' ? view?.companyName : view?.firmName;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600 mt-1">Gérez vos informations personnelles et professionnelles.</p>
        </div>
        {!editing && (
          <button
            onClick={() => { setError(null); setEditing(true); }}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center shadow-lg shadow-primary-500/30"
          >
            <Pencil className="w-4 h-4 mr-2" /> Modifier le profil
          </button>
        )}
      </div>

      {error && !editing && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-start">
          <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>Profil mis à jour avec succès !</span>
        </div>
      )}

      {!editing ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <User className="h-4 w-4 mr-2" /> Nom Complet
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold">{view?.fullName || '—'}</dd>
              </div>

              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <Building className="h-4 w-4 mr-2" />
                  {role === 'entreprise' ? 'Nom de l\'Entreprise' : 'Nom du Cabinet'}
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold">{companyValue || '—'}</dd>
              </div>

              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <Mail className="h-4 w-4 mr-2" /> Email
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold break-all">{view?.email || '—'}</dd>
              </div>

              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <Phone className="h-4 w-4 mr-2" /> Téléphone
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold">{view?.phone || '—'}</dd>
              </div>

              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" /> Ville
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold">{view?.city || '—'}</dd>
              </div>

              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <CalendarDays className="h-4 w-4 mr-2" /> Membre depuis
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold">
                  {view?.memberSince
                    ? new Date(view.memberSince).toLocaleDateString('fr-FR', {
                        month: 'long', year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>

              <div className="md:col-span-2">
                <dt className="flex items-center text-sm font-medium text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" /> Adresse complète
                </dt>
                <dd className="mt-1 text-gray-900 font-semibold">{view?.address || '—'}</dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {view?.description || 'Aucune description renseignée.'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setEditing(false); setError(null); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-1" /> Annuler
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nom Complet</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {role === 'entreprise' ? 'Nom de l\'Entreprise' : 'Nom du Cabinet'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name={role === 'entreprise' ? 'companyName' : 'firmName'}
                  value={role === 'entreprise' ? formData.companyName : formData.firmName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Téléphone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ville</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Paris, Lyon..."
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Adresse complète</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
                placeholder="123 rue de la République..."
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="input-field resize-none"
                placeholder="Présentez votre activité..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto px-8 py-3 disabled:opacity-70 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-5 w-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
}
