import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { authApi } from '../../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('entreprise');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');
    setLoading(true);
    
    try {
      const payload = {
        role,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      };
      
      if (role === 'entreprise') {
        payload.companyName = formData.companyName;
      } else {
        payload.firmName = formData.companyName; 
      }
      
      const response = await authApi.register(payload);
      setSuccessMsg(response.message || 'Compte créé avec succès !');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl -rotate-12 flex items-center justify-center shadow-xl shadow-primary-500/30">
            <span className="text-white text-2xl font-bold rotate-12">C</span>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Compta<span className="text-primary-500">Link</span>
          </h2>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Join the platform and start connecting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white">
          
         
          <div className="flex p-1 space-x-1 bg-gray-100 rounded-xl mb-8">
            <button
              onClick={() => setRole('entreprise')}
              className={`w-full flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'entreprise' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Entreprise
            </button>
            <button
              onClick={() => setRole('cabinet')}
              className={`w-full flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                role === 'cabinet' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Cabinet
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                {successMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  className="input-field pl-11"
                  placeholder="Taha Yassine"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === 'entreprise' ? 'Company Name' : 'Firm Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="companyName"
                  type="text"
                  required
                  className="input-field pl-11"
                  placeholder={role === 'entreprise' ? 'Tech Ultra' : 'Accounting Pros' }
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="input-field pl-11"
                  placeholder={role === 'entreprise' ? 'Tech-Ultra@example.com' : 'Accounting-Pros@example.com'}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="input-field pl-11"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary group disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Création en cours...' : 'Create Account'}
                {!loading && <UserPlus className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center transition-colors">
                Sign in
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
