# 💰 Grille Tarifaire - Publicités FIDS

## Modes d'affichage

### 🖼️ Mode Half-Screen (Demi-écran)
**Description** : La publicité occupe 50% de l'écran, les informations de vols occupent l'autre 50%

**Avantages** :
- ✅ Moins intrusif
- ✅ Vols toujours visibles
- ✅ Tarif accessible
- ✅ Bonne visibilité continue

**Tarification suggérée (Madagascar)** :

| Formule | Tarif mensuel | Tarif annuel | Notes |
|---------|--------------|--------------|-------|
| **Basique** | 300k MGA | 3M MGA | 1 aéroport |
| **Standard** | 500k MGA | 5M MGA | 2-3 aéroports |
| **Premium** | 800k MGA | 8M MGA | Tous aéroports |
| **Au CPM** | 5k MGA/1000vues | - | Paiement à l'usage |

---

### 📺 Mode Full-Screen (Plein écran)
**Description** : La publicité occupe tout l'écran pendant une durée déterminée (interruption des vols)

**Avantages** :
- ✅ Impact maximum
- ✅ Attention garantie
- ✅ Format premium
- ✅ Idéal pour campagnes importantes

**Tarification suggérée (Madagascar)** :

| Formule | Tarif mensuel | Tarif annuel | Notes |
|---------|--------------|--------------|-------|
| **Basique** | 800k MGA | 8M MGA | 1 aéroport, max 6 diffusions/jour |
| **Standard** | 1.5M MGA | 15M MGA | 2-3 aéroports, max 12 diffusions/jour |
| **Premium** | 3M MGA | 30M MGA | Tous aéroports, diffusions illimitées |
| **Au CPM** | 20k MGA/1000vues | - | Paiement à l'usage (premium) |

---

## Exemples de prix

### Scénario 1 : Commerce local
- **Client** : Restaurant d'aéroport Ivato
- **Mode** : Half-screen
- **Formule** : Basique (1 aéroport - TNR)
- **Durée** : 1 an
- **Prix** : **3M MGA/an**

### Scénario 2 : Compagnie aérienne
- **Client** : Air Madagascar
- **Mode** : Full-screen
- **Formule** : Premium (tous aéroports)
- **Durée** : 1 an
- **Prix** : **30M MGA/an**

### Scénario 3 : Événement ponctuel
- **Client** : Festival Donia
- **Mode** : Full-screen
- **Formule** : Au CPM
- **Durée** : 1 mois (100k vues estimées)
- **Prix** : **2M MGA** (20k × 100)

### Scénario 4 : Hôtel de luxe
- **Client** : Carlton Madagascar
- **Mode** : Half-screen
- **Formule** : Standard (TNR, NOS, TMM)
- **Durée** : 6 mois
- **Prix** : **2.5M MGA** (500k/mois × 6)

---

## Multiplicateurs de prix

### Par durée
- **Mensuel** : Tarif de base
- **Trimestriel** : -5%
- **Semestriel** : -10%
- **Annuel** : -15%

### Par saison (optionnel)
- **Haute saison** (Juin-Septembre, Décembre) : +20%
- **Basse saison** (Janvier-Mai, Octobre-Novembre) : Tarif normal

### Par aéroport
- **TNR (Ivato)** : Tarif de base
- **NOS (Fascene)** : Tarif de base
- **TMM (Toamasina)** : -20%
- **Autres** : -30%

---

## Structure du contrat

### Minimum requis
```javascript
{
  displayMode: 'half-screen' | 'full-screen',
  
  pricing: {
    type: 'fixed' | 'per-view',
    baseAmount: Number,  // Montant de base
    currency: 'MGA',
    billingCycle: 'monthly' | 'quarterly' | 'yearly'
  },
  
  maxDiffusionsPerDay: Number,  // Pour full-screen
  
  airports: ['TNR', 'NOS'],  // ou tous
  
  startDate: Date,
  endDate: Date
}
```

### Exemple codé (Half-screen Premium)
```javascript
{
  displayMode: 'half-screen',
  
  pricing: {
    type: 'fixed',
    baseAmount: 800000,  // 800k MGA
    currency: 'MGA',
    billingCycle: 'monthly'
  },
  
  airports: [],  // Tous
  showOnAllAirports: true,
  
  startDate: '2025-01-01',
  endDate: '2025-12-31'  // 1 an
}
```

### Exemple codé (Full-screen au CPM)
```javascript
{
  displayMode: 'full-screen',
  
  pricing: {
    type: 'per-view',
    baseAmount: 20,  // 20 MGA par vue
    currency: 'MGA'
  },
  
  maxViews: 50000,  // Quota de vues
  maxDiffusionsPerDay: 20,
  
  airports: ['TNR'],
  
  startDate: '2025-06-01',
  endDate: '2025-08-31'  // 3 mois (haute saison)
}
```

---

## Recommandations commerciales

### Pour le mode Half-screen
- ✅ PME, commerces locaux, restaurants
- ✅ Présence continue et discrète
- ✅ Budget limité
- ✅ Construction de notoriété

### Pour le mode Full-screen
- ✅ Grandes entreprises, compagnies aériennes
- ✅ Lancements de produits
- ✅ Campagnes événementielles
- ✅ Fort impact recherché

### Mix recommandé
Combiner les deux modes pour optimiser le ROI :
- **80% Half-screen** : Présence continue
- **20% Full-screen** : Moments clés (heures de pointe)

---

## Notes importantes

> [!TIP]
> **Négociation** : Les tarifs indiqués sont des bases. Possibilité de créer des packages personnalisés pour les gros clients.

> [!WARNING]
> **Full-screen** : Limiter le nombre de diffusions par jour pour ne pas frustrer les passagers. Recommandé : max 2-3 minutes par heure.

> [!IMPORTANT]
> **Facturation** : Pour le mode "per-view", arrondir au millier supérieur pour simplifier la facturation.
