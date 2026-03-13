# Trustpilot Members SOS-Expat

Projet standalone de collecte d'avis Trustpilot via les membres des groupes WhatsApp SOS-Expat.

---

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Node.js | 20+ |
| PHP | 8.2+ |
| Composer | 2+ |
| MySQL | 8+ |
| Redis | 7+ (production uniquement) |

---

## Installation locale (XAMPP)

### 1. Base de données

```sql
-- Dans phpMyAdmin ou MySQL CLI :
source database/trustpilot_sos_expat.sql
CREATE USER 'trustpilot_user'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT SELECT, INSERT, UPDATE, DELETE ON trustpilot_sos_expat.* TO 'trustpilot_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Laravel API

```bash
cd laravel-api
cp .env.example .env
# Remplir DB_PASSWORD, OPENAI_API_KEY, BAILEYS_API_KEY dans .env
php artisan key:generate
php artisan migrate
php artisan db:seed  # Crée le compte Williams (williams@sos-expat.com / password)
php artisan serve --port=8000

# Dans un second terminal :
php artisan queue:work
```

### 3. Baileys Service

```bash
cd baileys-service
cp .env.example .env
# Remplir LARAVEL_API_URL et LARAVEL_API_KEY (= BAILEYS_API_KEY dans laravel-api/.env)
npm install
node src/index.js
# Scanner le QR code avec WhatsApp
```

### 4. React Dashboard

```bash
cd react-dashboard
# .env est déjà configuré pour localhost:8000
npm run dev
# Ouvrir http://localhost:5173
```

---

## Déploiement production (VPS Hetzner)

### Laravel

```bash
cd laravel-api
# Modifier .env : APP_ENV=production, DB_HOST, QUEUE_CONNECTION=redis, REDIS_PORT=6380
php artisan migrate --force
php artisan config:cache
php artisan route:cache
# Nginx + PHP-FPM (vhost dédié)
# Queue worker via PM2 :
pm2 start --name "queue-worker" --interpreter php -- artisan queue:work --sleep=3 --tries=3
```

### Baileys Service

```bash
cd baileys-service
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Scanner le QR code une seule fois : pm2 logs baileys-trustpilot
```

### React Dashboard

```bash
cd react-dashboard
# Modifier .env : VITE_API_URL=https://api.votre-domaine.com
npm run build
# Servir dist/ via Nginx static
```

---

## Session Baileys expirée

Si le service affiche `Connection Failure` ou `logged out` :

```bash
pm2 stop baileys-trustpilot
rm -rf baileys-service/auth_info/*
pm2 start baileys-trustpilot
pm2 logs baileys-trustpilot  # Scanner le QR code affiché
```

---

## Compte Williams (premier accès)

Créer manuellement via tinker ou seeder :

```bash
cd laravel-api
php artisan tinker
>>> \App\Models\User::create(['name'=>'Williams','email'=>'williams@sos-expat.com','password'=>bcrypt('VOTRE_MDP')]);
```

---

## Structure du projet

```
Trustpilot_members_sos_expat/
├── baileys-service/     Node.js — connexion WhatsApp + sync membres
├── laravel-api/         Laravel 11 — API REST + GPT-4 + BDD
├── react-dashboard/     React 18 + Vite + TypeScript — interface Williams
├── database/            Schema SQL
├── .gitignore
└── README.md
```
