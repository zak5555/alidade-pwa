/**
 * ALIDADE™ - Spanish Translation
 * Status: 100% Complete
 */

export default {
    common: {
        buttons: {
            calculate: "Calcular",
            reset: "Reiniciar",
            save: "Guardar",
            cancel: "Cancelar",
            close: "Cerrar",
            back: "Atrás",
            next: "Siguiente",
            confirm: "Confirmar",
            start: "Iniciar",
            stop: "Detener",
            submit: "Enviar",
            copy: "Copiar",
            share: "Compartir",
            download: "Descargar"
        },
        labels: {
            price: "Precio",
            distance: "Distancia",
            time: "Tiempo",
            status: "Estado",
            total: "Total",
            average: "Promedio",
            loading: "Cargando...",
            error: "Error",
            success: "Éxito",
            warning: "Advertencia",
            info: "Info"
        },
        units: { dh: "DH", km: "km", m: "m", min: "min", sec: "seg", hrs: "h" },
        messages: {
            no_data: "Sin datos disponibles",
            loading: "Cargando...",
            error_generic: "Algo salió mal",
            offline: "Sin conexión",
            online: "Conexión restaurada"
        }
    },
    nav: {
        home: "Inicio", souk: "Ops Souk", defense: "Defensa", intel: "Inteligencia",
        compass: "Brújula", phrases: "Frases", protocols: "Protocolos", settings: "Ajustes", map: "Mapa"
    },
    home: {
        greeting: "MARHABA", subtitle: "OPERATIVO",
        status: { online: "Sistema en línea", offline: "Modo sin conexión", syncing: "Sincronizando..." },
        cards: {
            map: { title: "Matriz de Navegación", subtitle: "MAPA TÁCTICO", desc: "Datos cartográficos tácticos.", download: "DESCARGAR", view: "VER MAPA" },
            souk: { title: "Operaciones Souk", subtitle: "ESTRATEGIA MERCADO", desc: "Herramientas para navegación de mercado." },
            defense: { title: "Matriz de Defensa", subtitle: "BASE DE AMENAZAS", desc: "Base de datos de estafas." }
        }
    },
    shadow: {
        title: "Medidor Sombra", subtitle: "Auditor de Taxi",
        inputs: { distance: "Distancia (km)", distance_placeholder: "Ingresa la distancia" },
        results: { fair_price: "Precio Justo", tourist_price: "Precio Turista", savings: "Ahorras", formula: "Fórmula" },
        tips: { title: "Consejos", insist_meter: "Insiste en el taxímetro", agree_price: "Negocia antes", screenshot: "Foto del taxímetro", exit_safe: "Baja en lugar seguro" }
    },
    haggle: {
        title: "Asistente Regateo", subtitle: "IA de Negociación",
        inputs: { vendor_offer: "Precio del Vendedor", vendor_placeholder: "Precio en DH" },
        prices: {
            shock: { label: "Precio Shock", desc: "Oferta inicial", tip: "25% del pedido" },
            fair: { label: "Precio Justo", desc: "Precio realista", tip: "30-35% del pedido" },
            walkaway: { label: "Límite Retiro", desc: "Máximo", tip: "Vete si rechazan" }
        },
        stages: { title: "Etapas", s1: "Etapa 1: Shock", s2: "Etapa 2: Contra", s3: "Etapa 3: Retirarse", s4: "Etapa 4: Acuerdo" },
        strategies: { aggressive: "Agresivo", balanced: "Equilibrado", conservative: "Conservador" },
        confidence: "Confianza", analyze: "Analizar", recording: "Registrar"
    },
    defense: {
        title: "Matriz de Defensa", subtitle: "Base de Estafas",
        header_subtitle: "Módulo de Defensa",
        survival_command: "COMANDO SUPERVIVENCIA",
        sos_button: "SOS 19/15",
        tabs: { threats: "AMENAZAS", logistics: "LOGÍSTICA", legal: "LEGAL & SOS", protocols: "Protocolos", phonetics: "Fonética" },
        threat_levels: { critical: "Crítico", high: "Alto", medium: "Medio", low: "Bajo" },
        scams: {
            dcc: { name: "Trampa DCC", desc: "Cajero en tu moneda", loss: "Pérdida: 5-8%", avoid: "Elige MAD" },
            taxi_meter: { name: "Taxímetro Roto", desc: "Taxímetro 'roto'", loss: "Sobrecargo: 2-3×", avoid: "Exige taxímetro" },
            guide: { name: "Falso Guía", desc: "Ayuda y luego cobra", loss: "100-500 DH", avoid: "La Shukran" },
            spice: { name: "Cambio Especias", desc: "Calidad diferente", loss: "50-80% menos", avoid: "Observa" },
            leather: { name: "Cuero Falso", desc: "Sintético", loss: "70-90% menos", avoid: "Prueba" },
            riad_redirect: { name: "Redirección Riad", desc: "Riad 'cerrado'", loss: "10-20%", avoid: "Llama directo" }
        },
        protocols: { title: "Protocolos", golden_rules: "Reglas de Oro", emergency: "Emergencias", phrases: "Frases" }
    },
    intel: {
        title: "Gemas Ocultas", subtitle: "Inteligencia Local",
        header_subtitle: "Base de Inteligencia",
        header_title: "GEMAS OCULTAS",
        tabs: {
            rations: "RACIONES",
            oxygen: "OXÍGENO",
            recon: "RECON",
            maze: "EL LABERINTO",
            elevation: "ELEVACIÓN",
            recovery: "RECUPERACIÓN",
            nightlife: "OPS NOCTURNAS"
        },
        scanner: { title: "Analizador Precios", desc: "Estimación IA", start: "Escanear" },
        categories: { food: "Comida", shopping: "Compras", culture: "Cultura", nature: "Naturaleza" }
    },
    forensics: {
        title: "Análisis Productos", subtitle: "Autenticidad",
        tabs: { argan: "Argán", saffron: "Azafrán", ceramics: "Cerámicas", leather: "Cuero", textiles: "Textiles", jewelry: "Joyería", antiques: "Antigüedades" },
        tests: { visual: "Visual", tactile: "Táctil", smell: "Olfativo", chemical: "Químico" },
        results: { authentic: "Auténtico", suspicious: "Sospechoso", fake: "Falso" }
    },
    vector: {
        title: "HUD Vector", subtitle: "Navegación Solar",
        compass: { title: "Brújula", calibrate: "Calibrar", heading: "Rumbo", north: "N", south: "S", east: "E", west: "O" },
        sun: { sunrise: "Amanecer", sunset: "Atardecer", golden_hour: "Hora Dorada", solar_noon: "Mediodía Solar" },
        prayer: { title: "Rezos", fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" }
    },
    phrases: {
        title: "Arsenal Frases", subtitle: "Darija",
        categories: { greetings: "Saludos", shopping: "Compras", directions: "Direcciones", numbers: "Números", emergency: "Emergencia", food: "Comida" },
        ui: { search: "Buscar...", play: "Reproducir", favorite: "Favorito", copy: "Copiar", favorites: "Favoritos", recent: "Recientes" },
        difficulty: { easy: "Fácil", medium: "Medio", hard: "Difícil" }
    },
    protocols: {
        title: "Código Insider", subtitle: "5 Días",
        tabs: { timeline: "Cronología", missions: "Misiones", intel: "Inteligencia" },
        days: { day1: "Día 1: Orientación", day2: "Día 2: Souk", day3: "Día 3: Tesoros", day4: "Día 4: Más Allá", day5: "Día 5: Experto" },
        status: { locked: "Bloqueado", unlocked: "Desbloqueado", completed: "Completado", in_progress: "En Progreso" }
    },
    settings: {
        title: "Ajustes", subtitle: "Configuración",
        sections: { appearance: "Apariencia", language: "Idioma", notifications: "Notificaciones", data: "Datos", about: "Acerca de" },
        language: { label: "Idioma", en: "English", fr: "Français", es: "Español", select: "Seleccionar" },
        theme: { label: "Tema", dark: "Oscuro", light: "Claro", auto: "Auto" },
        haptics: { label: "Háptico", enabled: "Activado", disabled: "Desactivado" },
        offline: { label: "Sin Conexión", download: "Descargar", clear: "Borrar", size: "Tamaño", last_sync: "Última Sync" },
        about: { version: "Versión", build: "Build", developer: "Desarrollador", support: "Soporte", privacy: "Privacidad", terms: "Términos" }
    },
    map: {
        title: "Mapa Táctico", subtitle: "Navegación",
        layers: { markers: "Marcadores", routes: "Rutas", zones: "Zonas", heatmap: "Mapa Calor" },
        poi: { riad: "Riad", restaurant: "Restaurante", cafe: "Café", mosque: "Mezquita", museum: "Museo", market: "Mercado", pharmacy: "Farmacia", atm: "Cajero", taxi: "Taxi" },
        actions: { center: "Centrar", directions: "Ruta", save: "Guardar", share: "Compartir" }
    },
    errors: { network: "Error de red.", timeout: "Tiempo agotado.", not_found: "No encontrado.", permission: "Permiso denegado.", generic: "Error.", offline: "Conexión requerida.", camera: "Cámara denegada.", location: "Ubicación denegada." },
    price_checker: { title: "Escáner Precios", subtitle: "Verificación IA", scanning: "Escaneando...", analyzing: "Analizando...", results: { fair: "Justo", overpriced: "Caro", deal: "Buen Precio", scam: "Estafa" }, confidence: "Confianza", suggested_offer: "Oferta Sugerida", walkaway: "Máximo" },
    currency: { title: "Convertidor", from: "De", to: "A", rate: "Tasa", updated: "Actualizado", offline_rate: "Tasa offline" },
    onboarding: { welcome: "Bienvenido a ALIDADE", tagline: "Supervivencia táctica Marrakech", steps: { language: "Idioma", permissions: "Permisos", ready: "¡Listo!" }, skip: "Saltar", continue: "Continuar" },

    wallet: {
        title: "BILLETERA INTELIGENTE",
        subtitle: "Inteligencia Presupuesto • Detección Estafas • Precios Justos",
        setup_title: "CONFIGURAR BILLETERA",
        setup_subtitle: "Configura tu presupuesto de viaje para seguimiento inteligente",
        status: { on_track: "EN BUEN CAMINO", spending_fast: "GASTANDO RÁPIDO", under_budget: "BAJO PRESUPUESTO", over_budget: "SOBRE PRESUPUESTO" },
        labels: {
            remaining: "restante de", day: "Día", per_day: "DH/día", spent: "gastado",
            add_expense: "AGREGAR GASTO", description: "Descripción", description_placeholder: "ej: taxi, tajine",
            recent_transactions: "TRANSACCIONES RECIENTES", no_transactions: "Sin transacciones. ¡Agrega tu primer gasto arriba!",
            by_category: "POR CATEGORÍA", reset_wallet: "Reiniciar", total_budget: "Presupuesto Total",
            trip_duration: "Duración del Viaje", days: "días", budget_intelligence: "INTELIGENCIA PRESUPUESTO", start_tracking: "INICIAR SEGUIMIENTO"
        },
        categories: { food: "Comida", transport: "Transporte", shopping: "Compras", activities: "Actividades", services: "Servicios", other: "Otro" },
        profiles: { backpacker: "Mochilero", budget: "Económico", mid_range: "Gama Media", luxury: "Lujo" },
        dcc: { title: "ESCUDO DCC ACTIVO", warning: "En cajeros: SIEMPRE elige MAD. Nunca EUR/USD.", full_title: "EL ESCUDO DCC", full_desc: "En cajeros, ofrecen tu moneda. Esto es", full_warning: "NUNCA EUR. La DCC agrega 5-10% de comisiones ocultas." },
        price_check: { fair: "Precio Justo", overpaid: "PAGASTE DE MÁS", severely_overpaid: "MUY SOBREPAGADO", scam_price: "PRECIO ESTAFA", great_deal: "¡GRAN OFERTA!", slightly_high: "ALGO CARO" }
    },

    souk: {
        title: "INTELIGENCIA SOUK",
        subtitle: "Operaciones de Mercado",
        header_main: "SOUK",
        header_sub: "INTELIGENCIA",
        category_matrix: "Matriz de Categorías",
        categories: {
            negotiation: "Negociación", negotiation_desc: "Guion de Regateo Pro",
            forensics: "Análisis", forensics_desc: "Autenticidad de Materiales",
            ceramics: "Cerámicas", ceramics_desc: "Alfarería y Decoración",
            leather: "Cuero", leather_desc: "Marroquinería Artesanal",
            rugs: "Alfombras", rugs_desc: "Tejidos y Kilims",
            metals: "Metales", metals_desc: "Cobre, Latón y Orfebrería"
        },
        price_database: { title: "BASE DE PRECIOS COMPLETA", desc: "31 Artículos • Todas Categorías • Buscar y Filtrar" }
    },

    dashboard: {
        system_status: "Estado del Sistema",
        navigation_matrix: "Matriz de Navegación",
        field_map: "ACCESO MAPA DE CAMPO",
        map_desc: "Accede a tus datos del mapa. Descarga para uso offline o conecta al feed en vivo.",
        download_offline: "DESCARGAR DATOS OFFLINE",
        offline_locked: "DATOS OFFLINE BLOQUEADOS",
        open_live_map: "ABRIR MAPA EN VIVO",
        package: "PAQUETE",
        operations_hub: "Centro de Operaciones",
        menu: {
            souk_ops: "OPS SOUK", market_intel: "Intel Mercado",
            defense: "DEFENSA", threat_matrix: "Matriz Amenazas",
            organic_lab: "LAB ORGÁNICO", food_safety: "Seguridad Alimentaria y Farmacia",
            intel: "INTEL", hidden_gems: "Gemas Ocultas",
            fortress: "LA FORTALEZA", solo_female: "Ops Mujer Sola",
            protocols: "PROTOCOLOS", insider_code: "Código Insider",
            vector_hud: "HUD VECTOR", compass_distance: "Brújula y Distancia",
            phrase_assistant: "ASISTENTE FRASES", speak_local: "Hablar Local"
        }
    }
};
