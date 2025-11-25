import { useState, useEffect } from 'react';
import advertisementService from '../../services/advertisementService';
import { BarChart3, TrendingUp, Eye, DollarSign, Download, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [allAds, setAllAds] = useState([]); // Stocker toutes les pubs
  const [filteredAds, setFilteredAds] = useState([]); // Pubs filtrées
  const [stats, setStats] = useState({
    totalViews: 0,
    totalRevenue: 0,
    activeAds: 0,
    averageViews: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [period, setPeriod] = useState('30');
  const [clientFilter, setClientFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  // Appliquer les filtres quand les dépendances changent
  useEffect(() => {
    applyFilters();
  }, [period, clientFilter, typeFilter, statusFilter, allAds]);

  const fetchReports = async () => {
    try {
      const adsData = await advertisementService.getAllAdvertisements();
      setAllAds(adsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setAllAds([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...allAds];

    // Filtre Période (Simulation car pas de date de vue précise pour chaque vue)
    // On filtre par date de début pour l'instant
    const now = new Date();
    if (period !== 'all') {
      const days = parseInt(period);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      result = result.filter(ad => new Date(ad.startDate) >= cutoffDate);
    }

    // Filtre Client
    if (clientFilter !== 'all') {
      result = result.filter(ad => ad.client?.name === clientFilter);
    }

    // Filtre Type
    if (typeFilter !== 'all') {
      result = result.filter(ad => ad.type === typeFilter);
    }

    // Filtre Statut
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(ad => ad.isActive === isActive);
    }

    setFilteredAds(result);
    calculateStats(result);
  };

  const calculateStats = (adsData) => {
    const totalViews = adsData.reduce((sum, ad) => sum + (ad.viewCount || 0), 0);
    const activeAdsCount = adsData.filter(ad => ad.isActive).length;
    
    const totalRevenue = adsData.reduce((sum, ad) => {
      if (ad.contract?.pricing?.amount) {
        return sum + ad.contract.pricing.amount;
      }
      return sum;
    }, 0);

    setStats({
      totalViews,
      totalRevenue,
      activeAds: activeAdsCount,
      averageViews: adsData.length > 0 ? Math.round(totalViews / adsData.length) : 0
    });
  };

  // Extraire les clients uniques pour le filtre
  const uniqueClients = [...new Set(allAds.map(ad => ad.client?.name).filter(Boolean))];

  // Préparer les données pour les graphiques (utiliser filteredAds)
  const topAds = [...filteredAds]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10);

  const barChartData = {
    labels: topAds.map(ad => ad.title.length > 20 ? ad.title.substring(0, 20) + '...' : ad.title),
    datasets: [
      {
        label: 'Vues',
        data: topAds.map(ad => ad.viewCount || 0),
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1
      }
    ]
  };

  const typeDistribution = {
    labels: ['Images', 'Vidéos', 'Textes'],
    datasets: [
      {
        label: '# de Publicités',
        data: [
          filteredAds.filter(ad => ad.type === 'image').length,
          filteredAds.filter(ad => ad.type === 'video').length,
          filteredAds.filter(ad => ad.type === 'text').length
        ],
        backgroundColor: [
          'rgba(147, 51, 234, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)'
        ],
        borderColor: [
          'rgba(147, 51, 234, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(147, 51, 234);
    doc.text('Rapport des Publicités', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
    
    // Stats globales
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Statistiques Globales', 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Vues Totales: ${stats.totalViews.toLocaleString()}`, 14, 50);
    doc.text(`Publicités Actives: ${stats.activeAds}`, 14, 57);
    doc.text(`Moyenne par publicité: ${stats.averageViews.toLocaleString()}`, 14, 64);
    doc.text(`Revenus Estimés: ${stats.totalRevenue.toLocaleString()} MGA`, 14, 71);
    
    // Tableau des performances
    const tableData = filteredAds.map(ad => [
      ad.title,
      ad.type,
      (ad.viewCount || 0).toLocaleString(),
      ad.duration + 's',
      ad.isActive ? 'Actif' : 'Inactif'
    ]);
    
    doc.autoTable({
      startY: 80,
      head: [['Publicité', 'Type', 'Vues', 'Durée', 'Statut']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`rapport-publicites-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    
    // Feuille 1: Statistiques globales
    const statsWS = XLSX.utils.json_to_sheet([{
      'Vues Totales': stats.totalViews,
      'Publicités Actives': stats.activeAds,
      'Moyenne par Pub': stats.averageViews,
      'Revenus Estimés (MGA)': stats.totalRevenue
    }]);

    // Feuille 2: Par publicité
    const adsWS = XLSX.utils.json_to_sheet(filteredAds.map(ad => ({
      'Titre': ad.title,
      'Type': ad.type,
      'Vues': ad.viewCount || 0,
      'Durée (s)': ad.duration,
      'Priorité': ad.priority,
      'Statut': ad.isActive ? 'Actif' : 'Inactif',
      'Client': ad.client?.name || '-',
      'Société': ad.client?.company || '-',
      'Type Tarif': ad.contract?.pricing?.type || '-',
      'Montant': ad.contract?.pricing?.amount || 0,
      'Max Vues': ad.contract?.maxViews || '-'
    })));

    // Feuille 3: Par client
    const clientStats = {};
    filteredAds.forEach(ad => {
      const clientName = ad.client?.name || 'Sans client';
      if (!clientStats[clientName]) {
        clientStats[clientName] = { vues: 0, ads: 0, revenus: 0 };
      }
      clientStats[clientName].vues += ad.viewCount || 0;
      clientStats[clientName].ads += 1;
      clientStats[clientName].revenus += ad.contract?.pricing?.amount || 0;
    });

    const clientsWS = XLSX.utils.json_to_sheet(
      Object.entries(clientStats).map(([name, data]) => ({
        'Client': name,
        'Nombre de Pubs': data.ads,
        'Total Vues': data.vues,
        'Revenus (MGA)': data.revenus
      }))
    );

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, statsWS, 'Statistiques');
    XLSX.utils.book_append_sheet(wb, adsWS, 'Par Publicité');
    XLSX.utils.book_append_sheet(wb, clientsWS, 'Par Client');

    // Télécharger
    XLSX.writeFile(wb, `rapport-publicites-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportCSV = async () => {
    const XLSX = await import('xlsx');
    
    const csvData = filteredAds.map(ad => ({
      'Titre': ad.title,
      'Type': ad.type,
      'Vues': ad.viewCount || 0,
      'Durée (s)': ad.duration,
      'Priorité': ad.priority,
      'Statut': ad.isActive ? 'Actif' : 'Inactif',
      'Date Début': ad.startDate ? new Date(ad.startDate).toLocaleDateString('fr-FR') : '',
      'Date Fin': ad.endDate ? new Date(ad.endDate).toLocaleDateString('fr-FR') : '',
      'Client': ad.client?.name || '',
      'Société': ad.client?.company || '',
      'Contrat #': ad.contract?.number || '',
      'Type Tarif': ad.contract?.pricing?.type || '',
      'Montant': ad.contract?.pricing?.amount || 0,
      'Devise': ad.contract?.pricing?.currency || '',
      'Mode Affichage': ad.displayMode || 'half-screen'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    // Créer un blob et télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-publicites-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            Rapports & Statistiques
          </h1>
          <p className="text-slate-600 mt-1">
            Performance de vos publicités
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Filtre Client */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
          >
            <option value="all">Tous les clients</option>
            {uniqueClients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>

          {/* Filtre Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
          >
            <option value="all">Tous types</option>
            <option value="image">Images</option>
            <option value="video">Vidéos</option>
            <option value="text">Textes</option>
          </select>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>

          {/* Filtre période */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all text-sm"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="all">Toute la période</option>
          </select>
          
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>

          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Vues Totales</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Pubs Actives</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.activeAds}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Moyenne/Pub</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.averageViews.toLocaleString()}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Revenus Estimés</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalRevenue.toLocaleString()} MGA</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Top 10 Publicités</h2>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Graphique circulaire */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Répartition par Type</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={typeDistribution} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Tableau des performances */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Performance par Publicité</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Publicité</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Vues</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Durée</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map(ad => (
                <tr key={ad._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {ad.mediaUrl && (
                        <img 
                          src={ad.mediaUrl} 
                          alt={ad.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{ad.title}</p>
                        <p className="text-sm text-slate-500">
                          {ad.client?.name || 'Client non défini'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600">{ad.type}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {(ad.viewCount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">{ad.duration}s</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      ad.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {ad.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-12 bg-white/50 rounded-2xl border border-white/50">
            <p className="text-slate-500">Aucune donnée disponible pour cette période</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
