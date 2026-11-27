# To-do du projet RDV Logistique

## À traiter

### Valider et publier la branche du calendrier admin

- Relire et valider les changements de la branche `codex/admin-appointment-details` avant publication.
- Créer le commit puis pousser la branche quand elle est prête.

### Rendre les créneaux 14 h–17 h persistants et partagés

- Faire passer les actions « verrouiller » et « déverrouiller » par une API backend sécurisée et enregistrer l’état par date dans Supabase.
- Utiliser la base comme source de vérité afin que les changements persistent après rechargement et soient reflétés côté admin et côté client.
- Mettre à jour l’API de disponibilités et le formulaire client pour proposer ces heures uniquement les jours déverrouillés, puis rafraîchir les affichages après les changements.
- Créer et appliquer une migration pour cette fonctionnalité.

> Pour l’instant, le déblocage dans le calendrier admin est temporaire et limité à la session du navigateur. Il ne modifie ni la base de données ni les disponibilités côté client.

### Migrer le middleware Next.js

- Remplacer `middleware.ts` par la convention `proxy.ts` recommandée par Next.js 16.

### Réévaluer le build avec Turbopack

- Le build de production fonctionne avec Webpack. Turbopack avait échoué sur le traitement PostCSS de `styles/globals.css` dans l’environnement Windows ; réexaminer ce point.

### Rendre toutes les pages responsive

- Adapter et vérifier les pages sur les tailles d’écran mobiles et desktop.

### Supprimer la possibilité de choisir samedi et dimanche

-Pourvoir défiler les dispos des chaque semaine

- voir pour enlever possibilité de réserver créneaux qui chavauche 14h (exemple créneau de 60 min qui commence à 13h30)
