import { useState, useEffect, useRef } from 'react';
import advertisementService from '../../services/advertisementService';
import { X, Upload, Image as ImageIcon, Video, Type, ChevronDown, FileText, User, DollarSign, Bell } from 'lucide-react';
import Button from '../common/Button';

// AccordionSection component défini en dehors pour éviter re-création
const AccordionSection = ({ id, title, icon: Icon, children, isExpanded, toggleSection }) => {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-600" />
          <span className="font-medium text-slate-700">{title}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const AdvertisementModal = ({ advertisement, airports, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'image',
    title: '',
    textContent: '',
    duration: 10,
    priority: 5,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    showOnAllAirports: true,
    airports: [],
    isActive: true,
    displayMode: 'half-screen',
    // Client
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    // Contract
    contractNumber: '',
    pricingType: 'fixed',
    pricingAmount: '',
    pricingCurrency: 'MGA',
    billingCycle: 'monthly',
    maxViews: '',
    maxDiffusionsPerDay: '',
    autoRenew: false,
    // Alerts
    expirationAlertEnabled: true,
    expirationAlertDays: 30,
    expirationAlertEmails: '',
    quotaAlertEnabled: true,
    quotaAlertThreshold: 90,
    quotaAlertEmails: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Accordion state
  const [expandedSections, setExpandedSections] = useState({
    client: false,
    contract: false,
    alerts: false
  });

  useEffect(() => {
    if (advertisement) {
      setFormData({
        type: advertisement.type,
        title: advertisement.title,
        textContent: advertisement.textContent || '',
        duration: advertisement.duration,
        priority: advertisement.priority,
        startDate: advertisement.startDate?.split('T')[0] || '',
        endDate: advertisement.endDate?.split('T')[0] || '',
        showOnAllAirports: advertisement.showOnAllAirports,
        airports: advertisement.airports || [],
        isActive: advertisement.isActive,
        displayMode: advertisement.displayMode || 'half-screen',
        // Client
        clientName: advertisement.client?.name || '',
        clientCompany: advertisement.client?.company || '',
        clientEmail: advertisement.client?.contact?.email || '',
        clientPhone: advertisement.client?.contact?.phone || '',
        // Contract
        contractNumber: advertisement.contract?.number || '',
        pricingType: advertisement.contract?.pricing?.type || 'fixed',
        pricingAmount: advertisement.contract?.pricing?.amount || '',
        pricingCurrency: advertisement.contract?.pricing?.currency || 'MGA',
        billingCycle: advertisement.contract?.pricing?.billingCycle || 'monthly',
        maxViews: advertisement.contract?.maxViews || '',
        maxDiffusionsPerDay: advertisement.contract?.maxDiffusionsPerDay || '',
        autoRenew: advertisement.contract?.autoRenew || false,
        // Alerts
        expirationAlertEnabled: advertisement.alerts?.expirationWarning?.enabled ?? true,
        expirationAlertDays: advertisement.alerts?.expirationWarning?.daysBeforeExpiry || 30,
        expirationAlertEmails: advertisement.alerts?.expirationWarning?.notifyEmails?.join(', ') || '',
        quotaAlertEnabled: advertisement.alerts?.quotaWarning?.enabled ?? true,
        quotaAlertThreshold: advertisement.alerts?.quotaWarning?.threshold || 90,
        quotaAlertEmails: advertisement.alerts?.quotaWarning?.notifyEmails?.join(', ') || ''
      });
      if (advertisement.mediaUrl) {
        setPreview(advertisement.mediaUrl);
      }
    }
  }, [advertisement]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper pour éviter la perte de focus
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = formData.type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Fichier trop volumineux. Max ${formData.type === 'image' ? '10' : '50'}MB`);
      return;
    }

    setMediaFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      
      // Basic fields
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('duration', formData.duration);
      data.append('priority', formData.priority);
      data.append('startDate', formData.startDate);
      if (formData.endDate) data.append('endDate', formData.endDate);
      data.append('showOnAllAirports', formData.showOnAllAirports);
      data.append('airports', JSON.stringify(formData.airports));
      data.append('isActive', formData.isActive);
      data.append('displayMode', formData.displayMode);

      // Media/Text
      if (formData.type === 'text') {
        data.append('textContent', formData.textContent);
      } else if (mediaFile) {
        data.append('media', mediaFile);
      }

      // Client info
      if (formData.clientName || formData.clientCompany) {
        data.append('client', JSON.stringify({
          name: formData.clientName,
          company: formData.clientCompany,
          contact: {
            email: formData.clientEmail,
            phone: formData.clientPhone
          }
        }));
      }

      // Contract info
      if (formData.contractNumber || formData.pricingAmount) {
        data.append('contract', JSON.stringify({
          number: formData.contractNumber || undefined,
          pricing: {
            type: formData.pricingType,
            amount: formData.pricingAmount ? parseFloat(formData.pricingAmount) : undefined,
            currency: formData.pricingCurrency,
            billingCycle: formData.billingCycle
          },
          maxViews: formData.maxViews ? parseInt(formData.maxViews) : undefined,
          maxDiffusionsPerDay: formData.maxDiffusionsPerDay ? parseInt(formData.maxDiffusionsPerDay) : undefined,
          autoRenew: formData.autoRenew,
          status: 'active'
        }));
      }

      // Alerts
      data.append('alerts', JSON.stringify({
        expirationWarning: {
          enabled: formData.expirationAlertEnabled,
          daysBeforeExpiry: parseInt(formData.expirationAlertDays),
          notifyEmails: formData.expirationAlertEmails
            ? formData.expirationAlertEmails.split(',').map(e => e.trim()).filter(e => e)
            : []
        },
        quotaWarning: {
          enabled: formData.quotaAlertEnabled,
          threshold: parseInt(formData.quotaAlertThreshold),
          notifyEmails: formData.quotaAlertEmails
            ? formData.quotaAlertEmails.split(',').map(e => e.trim()).filter(e => e)
            : []
        }
      }));

      if (advertisement) {
        await advertisementService.updateAdvertisement(advertisement._id, data);
      } else {
        await advertisementService.createAdvertisement(data);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setLoading(false);
    }
  };

  const handleAirportToggle = (code) => {
    setFormData(prev => ({
      ...prev,
      airports: prev.airports.includes(code)
        ? prev.airports.filter(c => c !== code)
        : [...prev.airports, code]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-100">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6" />
                {advertisement ? 'Modifier la publicité' : 'Nouvelle publicité'}
              </h3>
              <button type="button" onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 text-sm">
                  {error}
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de publicité</label>
                <div className="grid grid-cols-3 gap-3">
                  {['image', 'video', 'text'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.type === type
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                      disabled={!!advertisement}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {type === 'image' && <ImageIcon className="w-6 h-6" />}
                        {type === 'video' && <Video className="w-6 h-6" />}
                        {type === 'text' && <Type className="w-6 h-6" />}
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                  required
                  placeholder="Ex: Promo Air Madagascar"
                />
              </div>

              {/* Upload ou texte */}
              {formData.type === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contenu du texte *</label>
                  <textarea
                    value={formData.textContent}
                    onChange={(e) => handleInputChange('textContent', e.target.value)}
                    className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                    rows={4}
                    required
                    placeholder="Texte à afficher..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {formData.type === 'image' ? 'Image' : 'Vidéo'} {!advertisement && '*'}
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  >
                    {preview ? (
                      <div className="relative">
                        {formData.type === 'image' ? (
                          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                        ) : (
                          <video src={preview} className="max-h-48 mx-auto rounded-lg" controls />
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={(e) => { e.stopPropagation(); setPreview(null); setMediaFile(null); }}
                          className="mt-3"
                        >
                          Changer
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">Cliquez pour uploader</p>
                        <p className="text-slate-400 text-sm mt-1">
                          {formData.type === 'image' ? 'JPG, PNG, WebP - Max 10MB' : 'MP4, WebM - Max 50MB'}
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                    className="hidden"
                  />
                </div>
              )}

              {/* Mode d'affichage */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mode d'affichage</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayMode: 'half-screen' })}
                    className={`p-3 rounded-xl border-2 transition-all text-sm ${
                      formData.displayMode === 'half-screen'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 hover:border-purple-300 text-slate-700'
                    }`}
                  >
                    <div className="font-medium">Half-Screen</div>
                    <div className="text-xs mt-1 opacity-75">Partagé avec vols</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayMode: 'full-screen' })}
                    className={`p-3 rounded-xl border-2 transition-all text-sm ${
                      formData.displayMode === 'full-screen'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 hover:border-purple-300 text-slate-700'
                    }`}
                  >
                    <div className="font-medium">Full-Screen</div>
                    <div className="text-xs mt-1 opacity-75">Plein écran</div>
                  </button>
                </div>
              </div>

              {/* Durée et Priorité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durée (secondes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                    min="3"
                    max="60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priorité (1-10)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                    min="1"
                    max="10"
                    required
                  />
                </div>
                </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date de début</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>

              {/* Ciblage aéroports */}
              <div>
                <label className="flex items-center p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showOnAllAirports}
                    onChange={(e) => handleInputChange('showOnAllAirports', e.target.checked)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    Afficher sur tous les aéroports
                  </span>
                </label>
              </div>

              {!formData.showOnAllAirports && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sélectionner les aéroports</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 bg-slate-50 rounded-xl">
                    {airports.map((airport) => (
                      <label key={airport.code} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.airports.includes(airport.code)}
                          onChange={() => handleAirportToggle(airport.code)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-slate-700">{airport.code} - {airport.city}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Statut actif */}
              <div>
                <label className="flex items-center p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    Publicité active
                  </span>
                </label>
              </div>

              {/* SECTION: Informations Client */}
              <AccordionSection 
                id="client" 
                title="Informations Client" 
                icon={User}
                isExpanded={expandedSections.client}
                toggleSection={toggleSection}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom du client</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Société</label>
                    <input
                      type="text"
                      value={formData.clientCompany}
                      onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      placeholder="Air Madagascar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      placeholder="+261 34 00 000 00"
                    />
                  </div>
                </div>
              </AccordionSection>

              {/* SECTION: Contrat */}
              <AccordionSection id="contract" title="Détails du Contrat" icon={FileText} isExpanded={expandedSections.contract} toggleSection={toggleSection}>
                <div className="space-y-4">
                  {/* Numéro de contrat */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Numéro de contrat</label>
                    <input
                      type="text"
                      value={formData.contractNumber}
                      onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      placeholder="CNT-2025-001"
                    />
                  </div>

                  {/* Tarification */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Type de tarif</label>
                      <select
                        value={formData.pricingType}
                        onChange={(e) => handleInputChange('pricingType', e.target.value)}
                        className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      >
                        <option value="fixed">Fixe</option>
                        <option value="per-view">Par vue</option>
                        <option value="per-day">Par jour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Montant</label>
                      <input
                        type="number"
                        value={formData.pricingAmount}
                        onChange={(e) => handleInputChange('pricingAmount', e.target.value)}
                        className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                        placeholder="1000000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Devise</label>
                      <select
                        value={formData.pricingCurrency}
                        onChange={(e) => handleInputChange('pricingCurrency', e.target.value)}
                        className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      >
                        <option value="MGA">MGA (Ariary)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="USD">USD (Dollar)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Cycle de facturation</label>
                      <select
                        value={formData.billingCycle}
                        onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                        className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                      >
                        <option value="monthly">Mensuel</option>
                        <option value="quarterly">Trimestriel</option>
                        <option value="yearly">Annuel</option>
                        <option value="one-time">Ponctuel</option>
                      </select>
                    </div>
                  </div>

                  {/* Quotas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quota max de vues</label>
                      <input
                        type="number"
                        value={formData.maxViews}
                        onChange={(e) => handleInputChange('maxViews', e.target.value)}
                        className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                        placeholder="10000 (optionnel)"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Max diffusions/jour</label>
                      <input
                        type="number"
                        value={formData.maxDiffusionsPerDay}
                        onChange={(e) => handleInputChange('maxDiffusionsPerDay', e.target.value)}
                        className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                        placeholder="100 (optionnel)"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Renouvellement auto */}
                  <label className="flex items-center p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.autoRenew}
                      onChange={(e) => handleInputChange('autoRenew', e.target.checked)}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-700">
                      Renouvellement automatique
                    </span>
                  </label>
                </div>
              </AccordionSection>

              {/* SECTION: Alertes */}
              <AccordionSection id="alerts" title="Configuration des Alertes" icon={Bell} isExpanded={expandedSections.alerts} toggleSection={toggleSection}>
                <div className="space-y-4">
                  {/* Alerte d'expiration */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.expirationAlertEnabled}
                        onChange={(e) => handleInputChange('expirationAlertEnabled', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">Alerte d'expiration</span>
                    </label>
                    {formData.expirationAlertEnabled && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Jours avant échéance</label>
                          <input
                            type="number"
                            value={formData.expirationAlertDays}
                            onChange={(e) => handleInputChange('expirationAlertDays', e.target.value)}
                            className="w-full rounded-lg border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                            min="1"
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Emails (séparés par virgule)</label>
                          <input
                            type="text"
                            value={formData.expirationAlertEmails}
                            onChange={(e) => handleInputChange('expirationAlertEmails', e.target.value)}
                            className="w-full rounded-lg border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                            placeholder="admin@fids.mg, manager@fids.mg"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Alerte de quota */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.quotaAlertEnabled}
                        onChange={(e) => handleInputChange('quotaAlertEnabled', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-slate-700">Alerte de quota</span>
                    </label>
                    {formData.quotaAlertEnabled && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Seuil (%)</label>
                          <input
                            type="number"
                            value={formData.quotaAlertThreshold}
                            onChange={(e) => handleInputChange('quotaAlertThreshold', e.target.value)}
                            className="w-full rounded-lg border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                            min="1"
                            max="100"
                            placeholder="90"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Emails (séparés par virgule)</label>
                          <input
                            type="text"
                            value={formData.quotaAlertEmails}
                            onChange={(e) => handleInputChange('quotaAlertEmails', e.target.value)}
                            className="w-full rounded-lg border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
                            placeholder="admin@fids.mg, manager@fids.mg"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </AccordionSection>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto mt-3 sm:mt-0"
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementModal;
