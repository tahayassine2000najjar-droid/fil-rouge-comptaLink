import { useEffect, useState } from 'react';
import { authApi } from '../../lib/api';
import { Save, User, Building, Phone, MapPin, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    companyName: '', // For entreprise
    firmName: '',    // For cabinet
    description: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        const { user, profile } = res;
        setRole(user.role);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-1">Gérez vos informations personnelles et professionnelles.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
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
    </div>
  );
}
