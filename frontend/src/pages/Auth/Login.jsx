import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plane, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Rediriger selon le rôle
        const userRole = result.user?.role;
        let redirectPath = from !== '/' ? from : '/';
        
        if (userRole === 'ad-manager') {
          redirectPath = '/ad-manager';
        }
        
        navigate(redirectPath, { replace: true });
      } else {
        setError(result.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8FAFC]">
      {/* Aesthetic Background */}
      <div className="absolute inset-0 z-0">
        {/* Soft Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50"></div>
        
        {/* Organic Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-violet-400/20 to-fuchsia-300/20 rounded-full blur-3xl animate-float delay-2000"></div>
        
        {/* Noise Texture for Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 md:p-12 transform transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          
          {/* Logo Section */}
          <div className="text-center mb-10">
            <div className="relative inline-block group">
              <div className="h-24 w-24 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto transform transition-all duration-500 group-hover:rotate-6 group-hover:scale-105">
                <Plane className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 bg-white p-2 rounded-full shadow-md animate-bounce-slow">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <h2 className="mt-8 text-3xl font-bold text-slate-800 tracking-tight">
              Bienvenue
            </h2>
            <p className="mt-3 text-slate-500 font-medium text-base">
              Flight Management System
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50/80 border border-rose-100 p-4 rounded-2xl flex items-start animate-shake">
                <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-rose-600 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email</label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium shadow-sm"
                    placeholder="admin@adema.mg"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Mot de passe</label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium shadow-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                variant="gradient"
                loading={loading}
                className="w-full py-4 text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 rounded-2xl"
                icon={!loading && <ArrowRight className="h-5 w-5 ml-1" />}
              >
                Se connecter
              </Button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400 font-medium">
              © 2025 ADEMA • Secure Access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
