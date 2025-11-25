import { useState, useEffect, useRef } from 'react';
import advertisementService from '../../services/advertisementService';
import { X, Upload, Image as ImageIcon, Video, Type, Calendar, Hash } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

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
    isActive: true
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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
        isActive: advertisement.isActive
      });
      if (advertisement.mediaUrl) {
        setPreview(advertisement.mediaUrl);
      }
    }
  }, [advertisement]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const maxSize = formData.type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Fichier trop volumineux. Max ${formData.type === 'image' ? '10' : '50'}MB`);
      return;
    }

    setMediaFile(file);
    setError('');

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileChange(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('title', formData.title);
      data.append('duration', formData.duration);
      data.append('priority', formData.priority);
      data.append('startDate', formData.startDate);
      if (formData.endDate) data.append('endDate', formData.endDate);
      data.append('showOnAllAirports', formData.showOnAllAirports);
      data.append('airports', JSON.stringify(formData.airports));
      data.append('isActive', formData.isActive);

      if (formData.type === 'text') {
        data.append('textContent', formData.textContent);
      } else if (mediaFile) {
        data.append('media', mediaFile);
      }

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

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-100">
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
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
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
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
                        <p className="text-slate-600 font-medium">Cliquez ou glissez pour uploader</p>
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

              {/* Durée et Priorité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Durée (secondes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, showOnAllAirports: e.target.checked })}
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
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    Publicité active
                  </span>
                </label>
              </div>
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
