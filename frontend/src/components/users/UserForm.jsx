import { useState } from 'react';
import { X, Mail, User, Building2, Sparkles, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const UserForm = ({ user, airports = [], onSubmit, onClose }) => {
  const isEditMode = !!user;
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    airportCode: user?.airportCode || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.firstName) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName) newErrors.lastName = 'Le nom est requis';
    if (!formData.airportCode) newErrors.airportCode = 'L\'aéroport est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-slate-100">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {isEditMode ? 'Modifier l\'admin' : 'Créer un admin'}
                <Sparkles className="h-5 w-5 text-amber-400" />
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {isEditMode ? 'Mettre à jour les informations' : 'Ajouter un nouvel administrateur'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isEditMode}
                className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium ${
                  errors.email 
                    ? 'border-rose-300 focus:border-rose-500' 
                    : 'border-slate-200 focus:border-blue-500'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="admin@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-rose-500 font-medium flex items-center gap-1 ml-1">
                <AlertCircle className="h-4 w-4" /> {errors.email}
              </p>
            )}
            {isEditMode && (
              <p className="text-xs text-slate-400 ml-1">L'email ne peut pas être modifié</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Prénom */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Prénom</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium ${
                    errors.firstName 
                      ? 'border-rose-300 focus:border-rose-500' 
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="Jean"
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-rose-500 font-medium ml-1">{errors.firstName}</p>
              )}
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Nom</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium ${
                    errors.lastName 
                      ? 'border-rose-300 focus:border-rose-500' 
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="Dupont"
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-rose-500 font-medium ml-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Aéroport */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Aéroport assigné</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <select
                name="airportCode"
                value={formData.airportCode}
                onChange={handleChange}
                className={`block w-full pl-11 pr-10 py-3.5 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 font-medium appearance-none cursor-pointer hover:bg-slate-100 ${
                  errors.airportCode 
                    ? 'border-rose-300 focus:border-rose-500' 
                    : 'border-slate-200 focus:border-blue-500'
                }`}
              >
                <option value="">Sélectionner un aéroport</option>
                {airports.length === 0 && (
                  <option value="" disabled>Aucun aéroport disponible</option>
                )}
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.code} - {airport.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <div className="h-5 w-5 text-slate-400">▼</div>
              </div>
            </div>
            {airports.length === 0 && (
              <p className="text-sm text-amber-600 font-medium ml-1">
                ⚠️ Aucun aéroport chargé ({airports.length} aéroports)
              </p>
            )}
            {errors.airportCode && (
              <p className="text-sm text-rose-500 font-medium ml-1">{errors.airportCode}</p>
            )}
          </div>

          {/* Info génération mot de passe */}
          {!isEditMode && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <div className="p-1 bg-blue-100 rounded-full h-fit">
                <span className="text-xs">ℹ️</span>
              </div>
              <p className="text-sm text-blue-700 font-medium leading-relaxed">
                Un mot de passe temporaire sera généré automatiquement et affiché après la création.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1 shadow-lg shadow-blue-500/20"
            >
              {isEditMode ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
