import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authApi } from '../../lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const verify = async () => {
      setStatus('loading');
      try {
        const res = await authApi.verifyEmail(token);
        setMessage(res.message || 'Email vérifié avec succès.');
        setStatus('success');
      } catch (err) {
        setMessage(err.message);
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authApi.resendVerification(email);
      setMessage(res.message || 'Email de vérification renvoyé.');
      setStatus('success');
    } catch (err) {
      setMessage(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Compta<span className="text-primary-500">Link</span>
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100">
          {status === 'loading' && (
            <div className="flex flex-col items-center text-gray-600">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
              <p>Vérification de votre email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-green-700 mb-6">{message}</p>
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Se connecter
              </Link>
            </div>
          )}

          {(status === 'error' || (status === 'idle' && !token)) && (
            <div>
              <div className="flex items-start text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{message || 'Lien de vérification invalide ou absent.'}</span>
              </div>
              <form className="space-y-4" onSubmit={handleResend}>
                <label className="block text-sm font-medium text-gray-700">Renvoyer l'email de vérification</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="input-field pl-11"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Envoi...' : "Renvoyer l'email"}
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
