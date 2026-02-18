/**
 * ALIDADE™ - French Translation
 * Status: 100% Complete
 */

export default {
    common: {
        buttons: {
            calculate: "Calculer",
            reset: "Réinitialiser",
            save: "Sauvegarder",
            cancel: "Annuler",
            close: "Fermer",
            back: "Retour",
            next: "Suivant",
            confirm: "Confirmer",
            start: "Démarrer",
            stop: "Arrêter",
            submit: "Envoyer",
            copy: "Copier",
            share: "Partager",
            download: "Télécharger"
        },
        labels: {
            price: "Prix",
            distance: "Distance",
            time: "Temps",
            status: "Statut",
            total: "Total",
            average: "Moyenne",
            loading: "Chargement...",
            error: "Erreur",
            success: "Succès",
            warning: "Attention",
            info: "Info"
        },
        units: { dh: "DH", km: "km", m: "m", min: "min", sec: "sec", hrs: "h" },
        messages: {
            no_data: "Aucune donnée disponible",
            loading: "Chargement...",
            error_generic: "Une erreur s'est produite",
            offline: "Vous êtes hors ligne",
            online: "Connexion rétablie"
        }
    },
    nav: {
        home: "Accueil", souk: "Ops Souk", defense: "Défense", intel: "Renseignements",
        compass: "Boussole", phrases: "Phrases", protocols: "Protocoles", settings: "Paramètres", map: "Carte"
    },
    home: {
        greeting: "MARHABA", subtitle: "OPÉRATIF",
        status: { online: "Système en ligne", offline: "Mode hors ligne", syncing: "Sync..." },
        cards: {
            map: { title: "Matrice de Navigation", subtitle: "ACCÈS CARTE", desc: "Données cartographiques tactiques.", download: "TÉLÉCHARGER", view: "VOIR LA CARTE" },
            souk: { title: "Opérations Souk", subtitle: "STRATÉGIE MARCHÉ", desc: "Outils pour la navigation au marché." },
            defense: { title: "Matrice de Défense", subtitle: "BASE MENACES", desc: "Base de données des arnaques." }
        }
    },
    shadow: {
        title: "Compteur Ombre", subtitle: "Auditeur Taxi",
        inputs: { distance: "Distance (km)", distance_placeholder: "Entrez la distance" },
        results: { fair_price: "Prix Juste", tourist_price: "Prix Touriste", savings: "Économisez", formula: "Formule" },
        tips: { title: "Conseils", insist_meter: "Insistez sur le compteur", agree_price: "Négociez avant", screenshot: "Photo du compteur", exit_safe: "Descendez en lieu sûr" }
    },
    haggle: {
        title: "Assistant Négociation", subtitle: "IA Marchandage",
        inputs: { vendor_offer: "Prix Vendeur", vendor_placeholder: "Prix en DH" },
        prices: {
            shock: { label: "Prix Choc", desc: "Offre d'ouverture", tip: "25% du demandé" },
            fair: { label: "Prix Équitable", desc: "Prix réaliste", tip: "30-35% du demandé" },
            walkaway: { label: "Seuil Retrait", desc: "Maximum", tip: "Partez si refus" }
        },
        stages: { title: "Étapes", s1: "Étape 1: Choc", s2: "Étape 2: Contre", s3: "Étape 3: Partir", s4: "Étape 4: Accord" },
        strategies: { aggressive: "Agressif", balanced: "Équilibré", conservative: "Prudent" },
        confidence: "Confiance", analyze: "Analyser", recording: "Enregistrer"
    },
    defense: {
        title: "Matrice de Défense", subtitle: "Base Arnaques",
        header_subtitle: "Module Défense",
        survival_command: "COMMANDEMENT SURVIE",
        sos_button: "SOS 19/15",
        tabs: { threats: "MENACES", logistics: "LOGISTIQUE", legal: "LÉGAL & SOS", protocols: "Protocoles", phonetics: "Phonétique" },
        threat_levels: { critical: "Critique", high: "Élevé", medium: "Moyen", low: "Faible" },
        scams: {
            dcc: { name: "Piège DCC", desc: "DAB en votre devise", loss: "Perte: 5-8%", avoid: "Choisir MAD" },
            taxi_meter: { name: "Compteur Cassé", desc: "Compteur 'cassé'", loss: "Surcharge: 2-3×", avoid: "Exigez compteur" },
            guide: { name: "Faux Guide", desc: "Aide puis paiement", loss: "100-500 DH", avoid: "La Shukran" },
            spice: { name: "Substitution Épices", desc: "Qualité différente", loss: "50-80% moins", avoid: "Surveillez" },
            leather: { name: "Faux Cuir", desc: "Synthétique", loss: "70-90% moins", avoid: "Testez" },
            riad_redirect: { name: "Redirection Riad", desc: "Riad 'fermé'", loss: "10-20%", avoid: "Appelez direct" }
        },
        protocols: { title: "Protocoles", golden_rules: "Règles d'Or", emergency: "Urgences", phrases: "Phrases" }
    },
    intel: {
        title: "Trésors Cachés", subtitle: "Renseignements",
        header_subtitle: "Base de Renseignements",
        header_title: "TRÉSORS CACHÉS",
        tabs: {
            rations: "RATIONS",
            oxygen: "OXYGÈNE",
            recon: "RECON",
            maze: "LE LABYRINTHE",
            elevation: "ÉLÉVATION",
            recovery: "RÉCUPÉRATION",
            nightlife: "OPS NOCTURNES"
        },
        scanner: { title: "Analyseur Prix", desc: "Estimation IA", start: "Scanner" },
        categories: { food: "Nourriture", shopping: "Shopping", culture: "Culture", nature: "Nature" }
    },
    forensics: {
        title: "Analyse Produits", subtitle: "Authenticité",
        tabs: { argan: "Argan", saffron: "Safran", ceramics: "Céramiques", leather: "Cuir", textiles: "Textiles", jewelry: "Bijoux", antiques: "Antiquités" },
        tests: { visual: "Visuel", tactile: "Tactile", smell: "Olfactif", chemical: "Chimique" },
        results: { authentic: "Authentique", suspicious: "Suspect", fake: "Faux" }
    },
    vector: {
        title: "HUD Vecteur", subtitle: "Navigation Solaire",
        compass: { title: "Boussole", calibrate: "Calibrer", heading: "Cap", north: "N", south: "S", east: "E", west: "O" },
        sun: { sunrise: "Lever", sunset: "Coucher", golden_hour: "Heure Dorée", solar_noon: "Midi Solaire" },
        prayer: { title: "Prières", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" }
    },
    phrases: {
        title: "Arsenal Phrases", subtitle: "Darija",
        categories: { greetings: "Salutations", shopping: "Shopping", directions: "Directions", numbers: "Chiffres", emergency: "Urgence", food: "Nourriture" },
        ui: { search: "Rechercher...", play: "Écouter", favorite: "Favori", copy: "Copier", favorites: "Favoris", recent: "Récents" },
        difficulty: { easy: "Facile", medium: "Moyen", hard: "Difficile" }
    },
    protocols: {
        title: "Code Initié", subtitle: "5 Jours",
        tabs: { timeline: "Chronologie", missions: "Missions", intel: "Renseignements" },
        days: { day1: "Jour 1: Orientation", day2: "Jour 2: Souk", day3: "Jour 3: Trésors", day4: "Jour 4: Au-delà", day5: "Jour 5: Expert" },
        status: { locked: "Verrouillé", unlocked: "Déverrouillé", completed: "Terminé", in_progress: "En Cours" }
    },
    settings: {
        title: "Paramètres", subtitle: "Configuration",
        sections: { appearance: "Apparence", language: "Langue", notifications: "Notifications", data: "Données", about: "À Propos" },
        language: { label: "Langue", en: "English", fr: "Français", es: "Español", select: "Sélectionner" },
        theme: { label: "Thème", dark: "Sombre", light: "Clair", auto: "Auto" },
        haptics: { label: "Haptique", enabled: "Activé", disabled: "Désactivé" },
        offline: { label: "Hors Ligne", download: "Télécharger", clear: "Effacer", size: "Taille", last_sync: "Sync" },
        about: { version: "Version", build: "Build", developer: "Développeur", support: "Support", privacy: "Confidentialité", terms: "Conditions" }
    },
    map: {
        title: "Carte Tactique", subtitle: "Navigation",
        layers: { markers: "Marqueurs", routes: "Itinéraires", zones: "Zones", heatmap: "Chaleur" },
        poi: { riad: "Riad", restaurant: "Restaurant", cafe: "Café", mosque: "Mosquée", museum: "Musée", market: "Marché", pharmacy: "Pharmacie", atm: "DAB", taxi: "Taxi" },
        actions: { center: "Centrer", directions: "Itinéraire", save: "Sauvegarder", share: "Partager" }
    },
    errors: { network: "Erreur réseau.", timeout: "Délai dépassé.", not_found: "Introuvable.", permission: "Permission refusée.", generic: "Erreur.", offline: "Connexion requise.", camera: "Caméra refusée.", location: "Localisation refusée." },
    price_checker: { title: "Scanner Prix", subtitle: "Vérification IA", scanning: "Scan...", analyzing: "Analyse...", results: { fair: "Juste", overpriced: "Trop Cher", deal: "Bonne Affaire", scam: "Arnaque" }, confidence: "Confiance", suggested_offer: "Offre Suggérée", walkaway: "Maximum" },
    currency: { title: "Convertisseur", from: "De", to: "Vers", rate: "Taux", updated: "Mise à jour", offline_rate: "Taux hors ligne" },
    onboarding: { welcome: "Bienvenue sur ALIDADE", tagline: "Survie tactique Marrakech", steps: { language: "Langue", permissions: "Permissions", ready: "Prêt !" }, skip: "Passer", continue: "Continuer" },

    wallet: {
        title: "PORTEFEUILLE INTELLIGENT",
        subtitle: "Intelligence Budget • Détection Arnaques • Prix Justes",
        setup_title: "CONFIGURATION PORTEFEUILLE",
        setup_subtitle: "Configurez votre budget voyage pour un suivi intelligent",
        status: { on_track: "EN BONNE VOIE", spending_fast: "DÉPENSES RAPIDES", under_budget: "SOUS BUDGET", over_budget: "HORS BUDGET" },
        labels: {
            remaining: "restant sur", day: "Jour", per_day: "DH/jour", spent: "dépensé",
            add_expense: "AJOUTER DÉPENSE", description: "Description", description_placeholder: "ex: taxi, tajine",
            recent_transactions: "TRANSACTIONS RÉCENTES", no_transactions: "Aucune transaction. Ajoutez votre première dépense !",
            by_category: "PAR CATÉGORIE", reset_wallet: "Réinitialiser", total_budget: "Budget Total",
            trip_duration: "Durée du Voyage", days: "jours", budget_intelligence: "INTELLIGENCE BUDGET", start_tracking: "COMMENCER LE SUIVI"
        },
        categories: { food: "Nourriture", transport: "Transport", shopping: "Shopping", activities: "Activités", services: "Services", other: "Autre" },
        profiles: { backpacker: "Routard", budget: "Économique", mid_range: "Moyen", luxury: "Luxe" },
        dcc: { title: "BOUCLIER DCC ACTIF", warning: "Au DAB: TOUJOURS choisir MAD. Jamais EUR/USD.", full_title: "LE BOUCLIER DCC", full_desc: "Aux DAB, on propose votre devise. C'est", full_warning: "JAMAIS EUR. La DCC ajoute 5-10% de frais cachés." },
        price_check: { fair: "Prix Juste", overpaid: "TROP CHER", severely_overpaid: "TRÈS TROP CHER", scam_price: "PRIX ARNAQUE", great_deal: "BONNE AFFAIRE !", slightly_high: "UN PEU CHER" }
    },

    souk: {
        title: "RENSEIGNEMENTS SOUK",
        subtitle: "Opérations Marché",
        header_main: "SOUK",
        header_sub: "TACTIQUE",
        category_matrix: "Matrice Catégories",
        categories: {
            negotiation: "Négociation", negotiation_desc: "Script de Négociation",
            forensics: "Analyse", forensics_desc: "Vérification Matières",
            ceramics: "Céramiques", ceramics_desc: "Poterie & Art de Table",
            leather: "Cuir", leather_desc: "Maroquinerie & Peaux",
            rugs: "Tapis", rugs_desc: "Tissage & Textiles",
            metals: "Métaux", metals_desc: "Cuivre, Laiton & Argent"
        },
        price_database: { title: "BASE DE PRIX COMPLÈTE", desc: "31 Articles • Toutes Catégories • Recherche & Filtres" }
    },

    dashboard: {
        system_status: "État du Système",
        navigation_matrix: "Matrice de Navigation",
        field_map: "ACCÈS CARTE TERRAIN",
        map_desc: "Accédez à vos données cartographiques. Téléchargez hors ligne ou connectez-vous au flux en direct.",
        download_offline: "TÉLÉCHARGER HORS LIGNE",
        offline_locked: "DONNÉES HORS LIGNE VERROUILLÉES",
        open_live_map: "OUVRIR CARTE EN DIRECT",
        package: "FORFAIT",
        operations_hub: "Hub Opérations",
        menu: {
            souk_ops: "OPS SOUK", market_intel: "Intel Marché",
            defense: "DÉFENSE", threat_matrix: "Matrice Menaces",
            organic_lab: "LABO BIO", food_safety: "Sécurité Alimentaire & Pharmacie",
            intel: "INTEL", hidden_gems: "Trésors Cachés",
            fortress: "LA FORTERESSE", solo_female: "Ops Femme Solo",
            protocols: "PROTOCOLES", insider_code: "Code Initié",
            vector_hud: "HUD VECTEUR", compass_distance: "Boussole & Distance",
            phrase_assistant: "ASSISTANT PHRASES", speak_local: "Parler Local"
        }
    }
};
