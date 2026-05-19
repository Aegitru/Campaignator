# WH40K — Campaign Tracker

Journal de bord narratif visuel et stylisé pour une campagne **Warhammer 40 000** entre amis. Pensez "panneau de contrôle d'un croiseur de bataille impérial" : texte et photos saisis par les joueurs, emballage spatial épique.

> Statut actuel : **V1** — fondations visuelles. La vue Système animée avec étoile centrale et planètes en orbite est jouable. Branchement Supabase en lecture à venir en V2.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind 4**
- **Supabase** (Postgres) pour le stockage
- **Cloudinary** pour les photos de bataille
- **Canvas HTML5** pour le rendu procédural (étoiles, planètes, galaxie)
- **react-markdown** pour les rapports de bataille
- Hébergement : **Vercel** (tier Hobby)

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis remplir avec tes vraies clés
npm run dev
```

Ouvre http://localhost:3000

## Variables d'environnement requises

Voir `.env.example`. Trois sources de configuration :

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — lecture publique côté client
- `SUPABASE_SERVICE_ROLE_KEY` — écriture côté serveur (Server Actions). **Ne jamais commit.**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — upload unsigned des photos

## Base de données

Migration unique dans `supabase/migrations/0001_init.sql`. À exécuter via le SQL Editor de Supabase 