# To-do du projet RDV Logistique

## À traiter plus tard

### Finaliser le flux de réservation client

- Faire transiter jusqu’au backend toutes les données utiles du formulaire : numéro de commande, email, total de palettes, fournisseurs et répartition de palettes.
- Remplacer les valeurs temporaires `TEMP` envoyées lors de la réservation et enregistrer les vraies données dans Supabase.
- Définir quelles informations de réservation doivent apparaître dans les aperçus des rendez-vous du calendrier admin, puis les afficher de façon lisible.
- Vérifier le schéma Supabase avant de choisir la structure de stockage des fournisseurs et de leur répartition.
- Conserver la validation serveur et la contrainte PostgreSQL qui empêche les chevauchements.

> Pour le moment, les valeurs `TEMP` sont conservées volontairement pour les tests.

### Nettoyer la configuration VS Code avant publication

- Examiner `.vscode/settings.json` et retirer les exclusions contenant des chemins propres à la machine.
- Ne pas inclure les réglages personnels dans les commits destinés au dépôt partagé.

### Préparer la publication des branches

- Pousser séparément `codex/rls-hardening` et `Page-verification-horaire` après validation de leurs commits respectifs.
- Intégrer ensuite le commit RLS à la branche de la fonctionnalité selon la stratégie de fusion retenue.

### Mettre à jour le middleware Next.js

- Migrer `middleware.ts` vers la convention `proxy.ts` recommandée par Next.js 16.
- Le build est actuellement configuré avec Webpack, car Turbopack plante sur le traitement PostCSS de `styles/globals.css` dans l’environnement Windows.

### Rendre les créneaux 14 h–17 h persistants et réservables

- Faire passer les actions « verrouiller » et « déverrouiller » par une API backend sécurisée, puis enregistrer l’état par date dans Supabase.
- Utiliser la base comme source de vérité afin que les changements persistent après rechargement et soient reflétés pour l’administrateur et les utilisateurs.
- Mettre à jour l’API de disponibilités et le formulaire client pour proposer ces heures uniquement les jours déverrouillés, et rafraîchir l’affichage après les changements.
- Créer, vérifier et appliquer la migration Supabase correspondante avant la mise en production.

> Pour l’instant, le déblocage dans le calendrier admin est temporaire et limité à la session du navigateur. Il ne modifie ni la base de données ni les disponibilités côté client.

