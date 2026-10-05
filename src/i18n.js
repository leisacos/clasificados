// UI strings for every language the site is published in.
// Add a language by copying the "en" block and adding it to site.config.json "languages".
const STRINGS = {
  en: {
    home: 'Home',
    destinations: 'Destinations',
    resources: 'Travel resources',
    about: 'About',
    menu: 'Menu',
    switchTo: 'Leer en español',
    heroKicker: 'Travel & street art by @{handle}',
    exploreDestinations: 'Explore destinations',
    seeOnInstagram: 'See it on Instagram',
    latestStory: 'Latest story',
    readStory: 'Read the story →',
    whereNext: 'Where to next?',
    whereNextText: 'Compare cheap flights, hotels and things to do. These are the same tools I use to plan every trip.',
    moreStories: 'More stories',
    followAlong: 'Follow along on Instagram',
    by: 'By',
    minRead: 'min read',
    affiliateNote: 'This post contains affiliate links.',
    learnMore: 'Learn more',
    planThisTrip: 'Plan this trip',
    dontTravelWithout: "Don't travel without",
    youMightLike: 'You might also like',
    notTranslated: '',
    planYourTrip: 'Plan your trip',
    planYourTripTo: 'Plan your trip to {where}',
    planIntro: 'These are the booking sites I use. If you book through them I may earn a small commission, at no extra cost to you.',
    destinationsLead: "Every place I've written about, with tips and bookings for each.",
    story: 'story',
    stories: 'stories',
    guideTitle: '{name} travel guide',
    guideLead: 'Stories, photos and tips from my trips to {name}.',
    guideDescription: 'Travel stories, things to do and booking tips for {name}.',
    notFoundTitle: 'Lost? Happens to the best travellers.',
    backHome: 'Head back home →',
    followOn: 'Follow @{handle} on Instagram',
    disclosure: 'Affiliate disclosure',
    privacy: 'Privacy',
    rss: 'RSS',
    fine: 'Some links on this site are affiliate links. If you book through them I may earn a commission at no extra cost to you.',
    langOffer: 'This page is also available in English.',
    langOfferCta: 'Read in English',
    viaBrand: 'via {brand}',
    savePin: 'Save to Pinterest',
    cta: {
      flights: ['Search flights', 'Flights to {where}'],
      hotels: ['Find hotels', 'Hotels in {where}'],
      tours: ['Tours & activities', 'Things to do in {where}'],
      insurance: ['Get travel insurance', 'Get travel insurance'],
      esim: ['Get a travel eSIM', 'Get a travel eSIM'],
    },
  },
  es: {
    home: 'Inicio',
    destinations: 'Destinos',
    resources: 'Recursos de viaje',
    about: 'Sobre mí',
    menu: 'Menú',
    switchTo: 'Read in English',
    heroKicker: 'Viajes y arte urbano por @{handle}',
    exploreDestinations: 'Explorar destinos',
    seeOnInstagram: 'Verlo en Instagram',
    latestStory: 'Última historia',
    readStory: 'Leer la historia →',
    whereNext: '¿A dónde vamos ahora?',
    whereNextText: 'Compará vuelos baratos, hoteles y actividades: las mismas herramientas que uso para planear cada viaje.',
    moreStories: 'Más historias',
    followAlong: 'Seguime en Instagram',
    by: 'Por',
    minRead: 'min de lectura',
    affiliateNote: 'Este artículo contiene enlaces de afiliado.',
    learnMore: 'Más información',
    planThisTrip: 'Planeá este viaje',
    dontTravelWithout: 'No viajes sin',
    youMightLike: 'También te puede gustar',
    notTranslated: 'Este artículo todavía no está traducido al español.',
    planYourTrip: 'Planeá tu viaje',
    planYourTripTo: 'Planeá tu viaje a {where}',
    planIntro: 'Estos son los sitios que uso para reservar. Si reservás a través de ellos puedo ganar una pequeña comisión, sin costo extra para vos.',
    destinationsLead: 'Todos los lugares sobre los que escribí, con consejos y reservas para cada uno.',
    story: 'historia',
    stories: 'historias',
    guideTitle: 'Guía de viaje de {name}',
    guideLead: 'Historias, fotos y consejos de mis viajes a {name}.',
    guideDescription: 'Historias de viaje, qué hacer y consejos para reservar en {name}.',
    notFoundTitle: '¿Perdido? Les pasa a los mejores viajeros.',
    backHome: 'Volver al inicio →',
    followOn: 'Seguí a @{handle} en Instagram',
    disclosure: 'Aviso de afiliados',
    privacy: 'Privacidad',
    rss: 'RSS',
    fine: 'Algunos enlaces de este sitio son de afiliado. Si reservás a través de ellos puedo ganar una comisión sin costo extra para vos.',
    langOffer: 'Esta página también está disponible en español.',
    langOfferCta: 'Leer en español',
    viaBrand: 'con {brand}',
    savePin: 'Guardar en Pinterest',
    cta: {
      flights: ['Buscar vuelos', 'Vuelos a {where}'],
      hotels: ['Buscar hoteles', 'Hoteles en {where}'],
      tours: ['Tours y actividades', 'Qué hacer en {where}'],
      insurance: ['Seguro de viaje', 'Seguro de viaje'],
      esim: ['eSIM para viajar', 'eSIM para viajar'],
    },
  },
};

function fill(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

function strings(lang) {
  return STRINGS[lang] || STRINGS.en;
}

// Localised value of a field: post.title_es for "es", falling back to post.title.
function loc(obj, key, lang, defaultLang = 'en') {
  if (!obj) return '';
  if (lang !== defaultLang && obj[`${key}_${lang}`]) return obj[`${key}_${lang}`];
  return obj[key] || '';
}

module.exports = { STRINGS, strings, fill, loc };
