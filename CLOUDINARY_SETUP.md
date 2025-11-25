# 🌤️ Guide de Configuration Cloudinary

## Étape 1 : Créer un compte Cloudinary

1. **Accédez à** : https://cloudinary.com/users/register_free
2. **Remplissez le formulaire** :
   - Email
   - Mot de passe
   - Nom de votre cloud (ex: `adema-flights`)
3. **Validez votre email**
4. **Connectez-vous** à votre dashboard Cloudinary

## Étape 2 : Récupérer vos Credentials

Une fois connecté au dashboard :

1. Sur la page d'accueil, vous verrez une section **"Product Environment Credentials"**
2. Notez les 3 informations suivantes :
   ```
   Cloud name: your_cloud_name
   API Key: your_api_key
   API Secret: your_api_secret (cliquez sur "Reveal" pour voir)
   ```

## Étape 3 : Configurer les Variables d'Environnement

1. **Ouvrez** le fichier `.env` dans le dossier `backend/`
2. **Ajoutez** ces lignes (remplacez par vos vraies valeurs) :

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Étape 4 : Configuration Optionnelle (Recommandée)

### Créer un dossier dédié pour les publicités

1. Dans votre dashboard Cloudinary, allez dans **Media Library**
2. Créez un dossier nommé `advertisements/`
3. Le code utilisera automatiquement ce dossier pour organiser vos médias

### Configurer les limites d'upload

Par défaut, notre code accepte :
- **Images** : jusqu'à 10 MB (JPG, PNG, WebP)
- **Vidéos** : jusqu'à 50 MB (MP4, WebM, MOV)

Vous pouvez ajuster ces limites dans Cloudinary :
1. Settings → Upload
2. Upload presets → Create upload preset
3. Nommez-le `adema_advertisements`

## Étape 5 : Vérification

Une fois configuré, l'application pourra :
- ✅ Upload automatique des images/vidéos
- ✅ Optimisation automatique (compression, format WebP)
- ✅ Suppression des médias quand vous supprimez une pub
- ✅ CDN global pour un chargement ultra-rapide

## 📊 Surveiller votre Utilisation

Plan gratuit Cloudinary :
- **Stockage** : 25 GB
- **Bande passante** : 25 GB/mois
- **Transformations** : 25 000/mois

Pour surveiller votre usage :
- Dashboard → Reports → Usage

## ⚠️ Important

**Ne JAMAIS commit vos credentials !**
- Le fichier `.env` est déjà dans `.gitignore`
- Ne partagez jamais votre API Secret
