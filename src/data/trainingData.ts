import { MergedProduct, OrderItem } from '../types';

export interface StylingItem {
  name: string;
  code?: string;
  image: string;
  role?: string;
}

export interface ModelAvailabilityInfo {
  isOrdered: boolean;
  orderedQty: number;
  soldQty: number;
  stockRemaining: number;
  isAvailable: boolean;
  isSoldOut: boolean;
}

export interface StylingLook {
  title: string;
  itemsListText: string;
  items: StylingItem[];
}

export interface ObjectionItem {
  objection: string;
  response: string;
}

export interface ModelTrainingData {
  modelName: string;
  modelId: string;
  season: {
    it: string;
    en: string;
    ru: string;
    pl: string;
  };
  heroImage: string;
  description: {
    it: string;
    en: string;
    ru: string;
    pl: string;
  };
  hasTechnicalData: boolean;
  colors: {
    name: {
      it: string;
      en: string;
      ru: string;
      pl: string;
    };
    code: string;
    image: string;
  }[];
  stylingLooks: {
    it: StylingLook[];
    en: StylingLook[];
    ru: StylingLook[];
    pl: StylingLook[];
  };
  salesTips: {
    it: string[];
    en: string[];
    ru: string[];
    pl: string[];
  };
  objections: {
    it: ObjectionItem[];
    en: ObjectionItem[];
    ru: ObjectionItem[];
    pl: ObjectionItem[];
  };
}

export type TrainingLanguage = 'it' | 'en' | 'ru' | 'pl';

export const LANGUAGE_LABELS: Record<TrainingLanguage, { label: string; flag: string }> = {
  it: { label: 'Italiano', flag: '🇮🇹' },
  en: { label: 'English', flag: '🇬🇧' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  pl: { label: 'Polski', flag: '🇵🇱' },
};

/**
 * Checks whether a styled item / model was ordered by the boutique
 * and how many units remain in stock (available / not sold).
 */
export function checkModelStockAndOrderStatus(
  modelRef: string,
  products: MergedProduct[] = [],
  orders: OrderItem[] = []
): ModelAvailabilityInfo {
  if (!modelRef) {
    return {
      isOrdered: false,
      orderedQty: 0,
      soldQty: 0,
      stockRemaining: 0,
      isAvailable: false,
      isSoldOut: false,
    };
  }

  // Extract base model name:
  // e.g. "Murice" -> "MURICE"
  // "Fabula 0101" -> "FABULA"
  // "Ulisside 0101" -> "ULISSIDE"
  // "Neanide 0002" -> "NEANIDE"
  // "Cremina 2331 2219" -> "CREMINA"
  // "Caprese B 2331" -> "CAPRESE"
  // "Pantaloni Olivetano" -> "OLIVETANO"
  const clean = modelRef
    .replace(/\b(платье|жакет|пальто|юбка|блузка|брюки|костюм|кардиган|топ|рубашка|сапоги|серьги|сумка|gilet|pullover|gonna|stivali|borsa|orecchini|pantaloni|tunic|dress|skirt|boots|bag|earrings)\b/gi, ' ')
    .replace(/\b\d{3,4}\b/g, ' ') // strip digit codes like 0101, 2331, 0002
    .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
    .trim()
    .toUpperCase();

  const words = clean.split(/\s+/).filter((w) => w.length >= 3 && !/^\d+$/.test(w));
  const candidateWord = words[0] || clean;

  // 1. Search in products (which have both orders and sell-out merged!)
  const matchedProducts = products.filter((p) => {
    const pStyleClean = (p.styleClean || p.styleName).toUpperCase();
    const pBase = (p.styleName || '').toUpperCase();
    return (
      pStyleClean === candidateWord ||
      pStyleClean.startsWith(candidateWord) ||
      pBase.includes(candidateWord) ||
      candidateWord.includes(pStyleClean)
    );
  });

  if (matchedProducts.length > 0) {
    const orderedQty = matchedProducts.reduce((sum, p) => sum + p.unitsOrdered, 0);
    const soldQty = matchedProducts.reduce((sum, p) => sum + p.unitsSold, 0);
    const stockRemaining = Math.max(0, orderedQty - soldQty);

    return {
      isOrdered: orderedQty > 0,
      orderedQty,
      soldQty,
      stockRemaining,
      isAvailable: stockRemaining > 0,
      isSoldOut: orderedQty > 0 && stockRemaining === 0,
    };
  }

  // 2. Fallback search in orders
  const matchedOrders = orders.filter((o) => {
    const oStyleClean = (o.styleName || '').toUpperCase();
    return (
      oStyleClean === candidateWord ||
      oStyleClean.startsWith(candidateWord) ||
      candidateWord.includes(oStyleClean)
    );
  });

  if (matchedOrders.length > 0) {
    const orderedQty = matchedOrders.reduce((sum, o) => sum + o.unitsOrdered, 0);
    return {
      isOrdered: true,
      orderedQty,
      soldQty: 0,
      stockRemaining: orderedQty,
      isAvailable: orderedQty > 0,
      isSoldOut: false,
    };
  }

  return {
    isOrdered: false,
    orderedQty: 0,
    soldQty: 0,
    stockRemaining: 0,
    isAvailable: false,
    isSoldOut: false,
  };
}

export function formatAvailabilityLabels(info: ModelAvailabilityInfo, lang: TrainingLanguage) {
  switch (lang) {
    case 'it':
      return {
        orderedBadge: info.isOrdered ? `Ordinato (${info.orderedQty} pz)` : 'Non ordinato',
        availabilityBadge: !info.isOrdered
          ? 'Non a catalogo boutique'
          : info.isAvailable
          ? `Disponibile: ${info.stockRemaining} pz (non venduto)`
          : 'Esaurito (0 pz disponibili)',
        shortStatus: info.isOrdered
          ? info.isAvailable
            ? `Ordinato (${info.orderedQty} pz) · Disponibile (${info.stockRemaining} pz non venduti)`
            : `Ordinato (${info.orderedQty} pz) · Esaurito`
          : 'Non ordinato (0 pz in boutique)',
      };
    case 'ru':
      return {
        orderedBadge: info.isOrdered ? `Заказано (${info.orderedQty} шт.)` : 'Не заказывалось',
        availabilityBadge: !info.isOrdered
          ? 'Нет в ассортименте бутика'
          : info.isAvailable
          ? `В наличии: ${info.stockRemaining} шт. (не продано)`
          : 'Распродано (0 шт. в наличии)',
        shortStatus: info.isOrdered
          ? info.isAvailable
            ? `Заказано (${info.orderedQty} шт.) · В наличии (${info.stockRemaining} шт. не продано)`
            : `Заказано (${info.orderedQty} шт.) · Распродано`
          : 'Не заказывалось (0 шт. в бутике)',
      };
    case 'en':
      return {
        orderedBadge: info.isOrdered ? `Ordered (${info.orderedQty} pcs)` : 'Not ordered',
        availabilityBadge: !info.isOrdered
          ? 'Not in boutique selection'
          : info.isAvailable
          ? `Available: ${info.stockRemaining} pcs (unsold)`
          : 'Sold out (0 pcs available)',
        shortStatus: info.isOrdered
          ? info.isAvailable
            ? `Ordered (${info.orderedQty} pcs) · Available (${info.stockRemaining} pcs in stock)`
            : `Ordered (${info.orderedQty} pcs) · Sold out`
          : 'Not ordered (0 pcs in boutique)',
      };
    case 'pl':
      return {
        orderedBadge: info.isOrdered ? `Zamówiono (${info.orderedQty} szt.)` : 'Nie zamówiono',
        availabilityBadge: !info.isOrdered
          ? 'Brak w asortymencie butiku'
          : info.isAvailable
          ? `Dostępne: ${info.stockRemaining} szt. (niesprzedane)`
          : 'Wyprzedane (0 szt.)',
        shortStatus: info.isOrdered
          ? info.isAvailable
            ? `Zamówiono (${info.orderedQty} szt.) · Dostępne (${info.stockRemaining} szt. niesprzedane)`
            : `Zamówiono (${info.orderedQty} szt.) · Wyprzedane`
          : 'Nie zamówiono (0 szt. w butiku)',
      };
  }
}

/**
 * Exact data for Caprese B extracted directly from Caprese-B-ru (1).pdf
 */
export const CAPRESE_B_TRAINING_DATA: ModelTrainingData = {
  modelName: 'Caprese B',
  modelId: 'ID #3',
  season: {
    it: 'Scheda di Formazione Autunno-Inverno 2026/2027',
    en: 'Training Materials Fall-Winter 2026/2027',
    ru: 'Учебные материалы Осень-Зима 2026/2027',
    pl: 'Materiały szkoleniowe Jesień-Zima 2026/2027',
  },
  heroImage: '/assets/training/caprese_b_hero.png',
  hasTechnicalData: true,
  description: {
    ru: 'Пуловер Caprese B от Luisa Spagnoli — это воплощение изысканного минимализма и безупречного итальянского мастерства. Модель представляет собой фундаментальный элемент гардероба в стиле «тихой роскоши», обеспечивающий идеальный баланс между тактильным комфортом и аристократичной эстетикой. Чистота линий и безупречная посадка делают этот пуловер универсальной базой для создания многослойных подиумных образов, подчеркивая приверженность бренда высочайшим стандартам качества.',
    it: 'Il pullover Caprese B di Luisa Spagnoli è la quintessenza del minimalismo raffinato e dell\'impeccabile maestria artigianale italiana. Il capo rappresenta un pilastro essenziale del guardaroba in stile «quiet luxury», donando un perfetto equilibrio tra comfort tattile ed estetica aristocratica. La purezza delle linee e la vestibilità impeccabile rendono questo pullover una base versatile per costruire look a strati di ispirazione sfilata, esaltando la fedeltà del brand ai più elevati standard d\'eccellenza.',
    en: 'The Caprese B pullover by Luisa Spagnoli is the embodiment of refined minimalism and impeccable Italian craftsmanship. The model represents a fundamental wardrobe cornerstone in the "quiet luxury" aesthetic, striking an ideal balance between tactile comfort and aristocratic elegance. Clean lines and a flawless fit make this sweater a versatile base for layered runway looks, underscoring the brand\'s devotion to highest quality standards.',
    pl: 'Puszysty sweter Caprese B od Luisa Spagnoli to ucieleśnienie wyrafinowanego minimalizmu i nieskazitelnego włoskiego kunsztu. Model ten stanowi fundamentalny element garderoby w stylu «cichego luksusu», zapewniając idealną równowagę między dotykowym komfortem a arystokratyczną estetyką. Czystość linii i nienaganny krój czynią ten sweter uniwersalną bazą do tworzenia warstwowych stylizacji wybiegowych, podkreślając przywiązanie marki do najwyższych standardów jakości.',
  },
  colors: [
    {
      name: {
        ru: 'Cammello',
        it: 'Cammello',
        en: 'Camel',
        pl: 'Wielbłądzi',
      },
      code: '2331',
      image: '/assets/training/caprese_cammello.png',
    },
    {
      name: {
        ru: 'Nero',
        it: 'Nero',
        en: 'Black',
        pl: 'Czarny',
      },
      code: '0101',
      image: '/assets/training/caprese_nero.png',
    },
    {
      name: {
        ru: 'Panna',
        it: 'Panna',
        en: 'Cream',
        pl: 'Kremowy',
      },
      code: '0202',
      image: '/assets/training/caprese_panna.png',
    },
  ],
  stylingLooks: {
    ru: [
      {
        title: 'Total Look (Cammello)',
        itemsListText:
          'Cremina 2331 2219, Caprese B 2331, Fragolino 3274, Ulisside 2240 0038, Iago 2240 0002, Nagorno 0002.',
        items: [
          {
            name: 'Cremina 2331 2219',
            image: '/assets/training/look_cremina_cammello.png',
            role: 'Gilet con cappuccio',
          },
          {
            name: 'Caprese B 2331',
            image: '/assets/training/look_caprese_cammello.png',
            role: 'Pullover dolcevita',
          },
          {
            name: 'Fragolino 3274',
            image: '/assets/training/look_fragolino.png',
            role: 'Gonna pencil check',
          },
          {
            name: 'Ulisside 2240 0038',
            image: '/assets/training/look_ulisside_cammello.png',
            role: 'Stivali in pelle',
          },
          {
            name: 'Iago 2240 0002',
            image: '/assets/training/look_iago.png',
            role: 'Borsa a spalla',
          },
          {
            name: 'Nagorno 0002',
            image: '/assets/training/look_nagorno.png',
            role: 'Orecchini scultura',
          },
        ],
      },
      {
        title: 'Total Look (Nero)',
        itemsListText:
          'Cremina 0101 0101, Caprese B 0101, Fabula 0101, Ulisside 0101 0038, Neanide 0002.',
        items: [
          {
            name: 'Cremina 0101 0101',
            image: '/assets/training/look_cremina_nero.png',
            role: 'Gilet nero con cappuccio',
          },
          {
            name: 'Caprese B 0101',
            image: '/assets/training/look_caprese_nero.png',
            role: 'Pullover dolcevita nero',
          },
          {
            name: 'Fabula 0101',
            image: '/assets/training/look_fabula.png',
            role: 'Gonna midi fluida',
          },
          {
            name: 'Ulisside 0101 0038',
            image: '/assets/training/look_ulisside_nero.png',
            role: 'Stivali in pelle neri',
          },
          {
            name: 'Neanide 0002',
            image: '/assets/training/look_neanide.png',
            role: 'Orecchini a doppio cerchio oro',
          },
        ],
      },
    ],
    it: [
      {
        title: 'Total Look (Cammello)',
        itemsListText:
          'Cremina 2331 2219, Caprese B 2331, Fragolino 3274, Ulisside 2240 0038, Iago 2240 0002, Nagorno 0002.',
        items: [
          {
            name: 'Cremina 2331 2219',
            image: '/assets/training/look_cremina_cammello.png',
            role: 'Gilet con cappuccio lana',
          },
          {
            name: 'Caprese B 2331',
            image: '/assets/training/look_caprese_cammello.png',
            role: 'Pullover dolcevita cammello',
          },
          {
            name: 'Fragolino 3274',
            image: '/assets/training/look_fragolino.png',
            role: 'Gonna a tubo disegno check',
          },
          {
            name: 'Ulisside 2240 0038',
            image: '/assets/training/look_ulisside_cammello.png',
            role: 'Stivali cuoio alti',
          },
          {
            name: 'Iago 2240 0002',
            image: '/assets/training/look_iago.png',
            role: 'Borsa a tracolla con catena',
          },
          {
            name: 'Nagorno 0002',
            image: '/assets/training/look_nagorno.png',
            role: 'Orecchini a nodo dorati',
          },
        ],
      },
      {
        title: 'Total Look (Nero)',
        itemsListText:
          'Cremina 0101 0101, Caprese B 0101, Fabula 0101, Ulisside 0101 0038, Neanide 0002.',
        items: [
          {
            name: 'Cremina 0101 0101',
            image: '/assets/training/look_cremina_nero.png',
            role: 'Gilet smanicato nero',
          },
          {
            name: 'Caprese B 0101',
            image: '/assets/training/look_caprese_nero.png',
            role: 'Pullover dolcevita nero',
          },
          {
            name: 'Fabula 0101',
            image: '/assets/training/look_fabula.png',
            role: 'Gonna plissé/pelle sartoriale',
          },
          {
            name: 'Ulisside 0101 0038',
            image: '/assets/training/look_ulisside_nero.png',
            role: 'Stivali neri in pelle',
          },
          {
            name: 'Neanide 0002',
            image: '/assets/training/look_neanide.png',
            role: 'Orecchini pendenti bicolore/oro',
          },
        ],
      },
    ],
    en: [
      {
        title: 'Total Look (Camel)',
        itemsListText:
          'Cremina 2331 2219, Caprese B 2331, Fragolino 3274, Ulisside 2240 0038, Iago 2240 0002, Nagorno 0002.',
        items: [
          {
            name: 'Cremina 2331 2219',
            image: '/assets/training/look_cremina_cammello.png',
            role: 'Hooded wool vest',
          },
          {
            name: 'Caprese B 2331',
            image: '/assets/training/look_caprese_cammello.png',
            role: 'Turtleneck pullover camel',
          },
          {
            name: 'Fragolino 3274',
            image: '/assets/training/look_fragolino.png',
            role: 'Check tailored skirt',
          },
          {
            name: 'Ulisside 2240 0038',
            image: '/assets/training/look_ulisside_cammello.png',
            role: 'Tall leather boots',
          },
          {
            name: 'Iago 2240 0002',
            image: '/assets/training/look_iago.png',
            role: 'Chain shoulder bag',
          },
          {
            name: 'Nagorno 0002',
            image: '/assets/training/look_nagorno.png',
            role: 'Sculptural knot earrings',
          },
        ],
      },
      {
        title: 'Total Look (Black)',
        itemsListText:
          'Cremina 0101 0101, Caprese B 0101, Fabula 0101, Ulisside 0101 0038, Neanide 0002.',
        items: [
          {
            name: 'Cremina 0101 0101',
            image: '/assets/training/look_cremina_nero.png',
            role: 'Black hooded vest',
          },
          {
            name: 'Caprese B 0101',
            image: '/assets/training/look_caprese_nero.png',
            role: 'Black turtleneck pullover',
          },
          {
            name: 'Fabula 0101',
            image: '/assets/training/look_fabula.png',
            role: 'Flowing midi skirt',
          },
          {
            name: 'Ulisside 0101 0038',
            image: '/assets/training/look_ulisside_nero.png',
            role: 'Black leather boots',
          },
          {
            name: 'Neanide 0002',
            image: '/assets/training/look_neanide.png',
            role: 'Gold hoop earrings',
          },
        ],
      },
    ],
    pl: [
      {
        title: 'Total Look (Wielbłądzi)',
        itemsListText:
          'Cremina 2331 2219, Caprese B 2331, Fragolino 3274, Ulisside 2240 0038, Iago 2240 0002, Nagorno 0002.',
        items: [
          {
            name: 'Cremina 2331 2219',
            image: '/assets/training/look_cremina_cammello.png',
            role: 'Kamizelka z kapturem',
          },
          {
            name: 'Caprese B 2331',
            image: '/assets/training/look_caprese_cammello.png',
            role: 'Golf w kolorze wielbłądzim',
          },
          {
            name: 'Fragolino 3274',
            image: '/assets/training/look_fragolino.png',
            role: 'Spódnica w kratę',
          },
          {
            name: 'Ulisside 2240 0038',
            image: '/assets/training/look_ulisside_cammello.png',
            role: 'Skórzane kozaki',
          },
          {
            name: 'Iago 2240 0002',
            image: '/assets/training/look_iago.png',
            role: 'Torebka na ramię',
          },
          {
            name: 'Nagorno 0002',
            image: '/assets/training/look_nagorno.png',
            role: 'Złote kolczyki węzły',
          },
        ],
      },
      {
        title: 'Total Look (Czarny)',
        itemsListText:
          'Cremina 0101 0101, Caprese B 0101, Fabula 0101, Ulisside 0101 0038, Neanide 0002.',
        items: [
          {
            name: 'Cremina 0101 0101',
            image: '/assets/training/look_cremina_nero.png',
            role: 'Czarna kamizelka',
          },
          {
            name: 'Caprese B 0101',
            image: '/assets/training/look_caprese_nero.png',
            role: 'Czarny golf',
          },
          {
            name: 'Fabula 0101',
            image: '/assets/training/look_fabula.png',
            role: 'Spódnica midi',
          },
          {
            name: 'Ulisside 0101 0038',
            image: '/assets/training/look_ulisside_nero.png',
            role: 'Czarne skórzane kozaki',
          },
          {
            name: 'Neanide 0002',
            image: '/assets/training/look_neanide.png',
            role: 'Złote podwójne kolczyki',
          },
        ],
      },
    ],
  },
  salesTips: {
    ru: [
      'Делайте ставку на универсальность: пуловер Caprese B является идеальным компаньоном для жакетов сложной фактуры, таких как Cremina, создавая гармоничный и завершенный образ.',
      'Рекомендуйте модель как инвестицию в базовый гардероб: классические оттенки кэмел, черный и молочный неподвластны времени и легко комбинируются с любыми сезонными новинками.',
      'Предлагайте игру контрастов: лаконичный трикотаж Caprese B превосходно сочетается с фактурными юбками, например, с моделью Fragolino в клетку или кожаными аксессуарами.',
    ],
    it: [
      'Puntare sulla massima versatilità: il pullover Caprese B è il compagno ideale sotto capispalla e gilet a texture complessa come Cremina, conferendo armonia e completezza alla silhouette.',
      'Consigliare il modello come investimento intramontabile nel guardaroba base: le tonalità iconiche cammello, nero e panna sfidano il tempo e si combinano con estrema facilità con tutte le novità stagionali.',
      'Proporre un ricercato gioco di contrasti: la maglieria essenziale di Caprese B si sposa magnificamente con gonne materiche, come il check sartoriale di Fragolino o raffinati accessori in pelle.',
    ],
    en: [
      'Bet on timeless versatility: the Caprese B pullover is the perfect companion for textured outerwear such as Cremina, providing a harmonious and impeccably styled outfit.',
      'Recommend as a staple luxury investment: camel, black, and ivory tones defy trends and effortlessly pair with fresh seasonal arrivals.',
      'Suggest a play on contrasts: the streamlined knitwear of Caprese B pairs beautifully with structured skirts like the houndstooth Fragolino or rich leather boots.',
    ],
    pl: [
      'Postaw na uniwersalność: sweter Caprese B jest idealnym towarzyszem kamizelek i żakietów o złożonej fakturze, takich jak Cremina, tworząc harmonijną całość.',
      'Polecaj model jako ponadczasową inwestycję w bazową garderobę: odcienie wielbłądzi, czarny i kremowy są odporne na upływ czasu i łatwo komponują się z nowościami sezonowymi.',
      'Zaproponuj grę kontrastów: minimalistyczna dzianina Caprese B doskonale łączy się z fakturowanymi spódnicami, na przykład z modelem Fragolino w kratę.',
    ],
  },
  objections: {
    ru: [
      {
        objection: 'Дизайн кажется слишком простым',
        response:
          'Истинная элегантность заключается именно в простоте. Эта модель задумана как безупречный холст, позволяющий роскоши тканей и аксессуаров Luisa Spagnoli выйти на первый план.',
      },
      {
        objection: 'Опасение, что оттенок кэмел может не подойти к тону кожи',
        response:
          'Оттенок 2331 (Cammello) был выбран нашими стилистами как наиболее универсальный теплый тон, который освежает цвет лица и придает образу благородное сияние.',
      },
      {
        objection: 'Нет официальных данных о точном составе',
        response:
          'Каждое изделие Luisa Spagnoli создается из тщательно отобранных натуральных волокон и проходит строгий контроль качества, гарантирующий долговечность и комфорт.',
      },
      {
        objection: 'Как стилизовать эту модель для вечернего выхода?',
        response:
          'Добавьте акцентные украшения, такие как серьги Neanide или колье Natalidi, и завершите образ элегантными ботильонами Ulisside для создания вечернего шика.',
      },
      {
        objection: 'Беспокойство об уходе за светлыми оттенками (Panna)',
        response:
          'Мы рекомендуем профессиональную чистку, которая сохранит структуру волокон и яркость молочного оттенка 0202 на многие сезоны.',
      },
    ],
    it: [
      {
        objection: 'Il design sembra troppo semplice ed essenziale',
        response:
          'L\'autentica eleganza risiede proprio nella purezza essenziale. Questo modello è concepito come una tela impeccabile che esalta la nobiltà dei filati e la lucentezza degli accessori Luisa Spagnoli.',
      },
      {
        objection: 'Timore che la nuance cammello non doni all\'incarnato',
        response:
          'La nuance 2331 (Cammello) è stata accuratamente calibrata dai nostri maestri coloristi come tono caldo universale, capace di illuminare il viso donando un\'allure aristocratica.',
      },
      {
        objection: 'Mancanza di dati tecnici esatti sulla composizione',
        response:
          'Ogni capo Luisa Spagnoli è realizzato impiegando fibre nobili attentamente selezionate e sottoposto a severi controlli qualitativi artigianali, a garanzia di eccezionale durata e comfort sensoriale.',
      },
      {
        objection: 'Come interpretare il capo per una serata elegante?',
        response:
          'Arricchisca la mise con gioielli scultura luminosi, quali gli orecchini Neanide o un collier d\'archivio, completando l\'ensemble con gli stivali in pelle Ulisside per un fascino serale senza tempo.',
      },
      {
        objection: 'Preoccupazione per la cura e la manutenzione dei toni chiari (Panna)',
        response:
          'Consigliamo un lavaggio professionale a secco dedicato alla maglieria pregiata, che preserva intatta la sofficità della fibra e la purezza della tonalità 0202 nel corso delle stagioni.',
      },
    ],
    en: [
      {
        objection: 'The design appears too simple',
        response:
          'True elegance lies in pure simplicity. This piece serves as an impeccable canvas allowing the luxury of Luisa Spagnoli fabrics and jewelry to take center stage.',
      },
      {
        objection: 'Concern that camel tone might wash out skin tone',
        response:
          'Shade 2331 (Camel) was specifically formulated as a warm universal tone that flatters the complexion with a luminous, aristocratic glow.',
      },
      {
        objection: 'No exact technical composition data provided',
        response:
          'Every Luisa Spagnoli creation is crafted from strictly vetted noble yarns and subjected to rigorous artisanal quality controls, ensuring lasting softness and durability.',
      },
      {
        objection: 'How to transition this sweater for evening occasions?',
        response:
          'Elevate with statement gold earrings like Neanide, an archival clutch, and polished Ulisside leather boots for effortless Italian sophistication.',
      },
      {
        objection: 'Worry about caring for delicate light shades like Panna',
        response:
          'We recommend professional fine knitwear dry cleaning to retain the loft of the fibers and the pure radiance of tone 0202 for years to come.',
      },
    ],
    pl: [
      {
        objection: 'Wzór wydaje się zbyt prosty',
        response:
          'Prawdziwa elegancja tkwi w prostocie. Model ten został zaprojektowany jako idealne tło, pozwalające wybić się na pierwszy plan luksusowym tkaninom i dodatkom Luisa Spagnoli.',
      },
      {
        objection: 'Obawa, że odcień camel nie będzie pasował do karnacji',
        response:
          'Odcień 2331 (Cammello) został dobrany przez naszych stylistów jako uniwersalny ciepły ton, który rozświetla cerę i nadaje arystokratyczny blask.',
      },
      {
        objection: 'Brak oficjalnych danych o dokładnym składzie',
        response:
          'Każdy wyrób Luisa Spagnoli powstaje ze starannie wyselekcjonowanych naturalnych włókien i przechodzi rygorystyczną kontrolę jakości, gwarantującą trwałość i komfort.',
      },
      {
        objection: 'Jak stylizować ten model na wieczorne wyjście?',
        response:
          'Dodaj wyrazistą biżuterię, np. kolczyki Neanide, i uzupełnij stylizację eleganckimi botkami Ulisside, tworząc wieczorowy szyk.',
      },
      {
        objection: 'Obawy o pielęgnację jasnych odcieni (Panna)',
        response:
          'Zalecamy profesjonalne czyszczenie, które zachowa strukturę włókien i jasność odcienia 0202 na wiele sezonów.',
      },
    ],
  },
};

/**
 * Builds or adapts training data for any model in the catalog
 */
export function getModelTrainingData(
  modelName: string,
  modelNumber?: string,
  image?: string,
  silhouette?: string,
  colorName?: string,
  fabrication?: string,
  colorsList?: { name: string; code: string; image?: string }[]
): ModelTrainingData {
  const normName = modelName.trim().toUpperCase();

  // If Caprese B, return exact PDF replica
  if (normName.includes('CAPRESE')) {
    return CAPRESE_B_TRAINING_DATA;
  }

  // Built-in high fashion Luisa Spagnoli training generator
  const sil = silhouette || 'Capo Sartoriale';
  const hero =
    image ||
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80';
  const modId = modelNumber ? `Mod. #${modelNumber}` : 'ID #LS-26';

  const defaultColors =
    colorsList && colorsList.length > 0
      ? colorsList.map((c) => ({
          name: { it: c.name, en: c.name, ru: c.name, pl: c.name },
          code: c.code || '0101',
          image: c.image || hero,
        }))
      : [
          {
            name: {
              it: colorName || 'Marrone Fondente',
              en: colorName || 'Dark Brown',
              ru: colorName || 'Шоколадный',
              pl: colorName || 'Ciemny Brąz',
            },
            code: '3331',
            image: hero,
          },
          {
            name: { it: 'Nero Assoluto', en: 'Pure Black', ru: 'Черный', pl: 'Czarny' },
            code: '0101',
            image: '/assets/training/look_cremina_nero.png',
          },
          {
            name: { it: 'Cammello Caldo', en: 'Warm Camel', ru: 'Верблюжий', pl: 'Ciepły Camel' },
            code: '2331',
            image: '/assets/training/caprese_cammello.png',
          },
        ];

  const hasTech = Boolean(fabrication && fabrication.length > 3);
  const techStoryIt = hasTech
    ? `Realizzato con eccellenza in ${fabrication}, unisce comfort e drappeggio magistrale.`
    : 'Dati tecnici non presenti - Storytelling di collezione: la silhouette celebra l\'eccellenza sartoriale perugina con proporzioni armoniose e finiture invisibili.';

  const techStoryRu = hasTech
    ? `Модель выполнена из ткани ${fabrication}, обеспечивая идеальную посадку и драпировку.`
    : 'Технические данные отсутствуют — Исторический нарратив коллекции: силуэт подчеркивает традиционное мастерство Luisa Spagnoli с безупречными пропорциями.';

  const techStoryEn = hasTech
    ? `Expertly tailored in ${fabrication}, offering superior comfort and fluid structure.`
    : 'Technical data not present - Collection storytelling: this silhouette celebrates Italian sartorial heritage with balanced proportions and immaculate finishes.';

  const techStoryPl = hasTech
    ? `Wykonany z materiału ${fabrication}, łączy wygodę z perfekcyjnym układaniem się tkaniny.`
    : 'Brak danych technicznych - Narracja kolekcji: fason celebruje włoskie rzemiosło krawieckie o harmonijnych proporcjach.';

  return {
    modelName: modelName.charAt(0).toUpperCase() + modelName.slice(1),
    modelId: modId,
    season: {
      it: 'Scheda di Formazione Autunno-Inverno 2026/2027',
      en: 'Training Materials Fall-Winter 2026/2027',
      ru: 'Учебные материалы Осень-Зима 2026/2027',
      pl: 'Materiały szkoleniowe Jesień-Zima 2026/2027',
    },
    heroImage: hero,
    hasTechnicalData: hasTech,
    description: {
      it: `Il modello ${modelName} di Luisa Spagnoli reinterpreta la categoria ${sil} attraverso una visione di lusso discreto e contemporaneo. La cura minuziosa per il taglio e la selezione meticolosa delle fibre nobili offrono una vestibilità studiata per esaltare la figura femminile senza costrizioni. ${techStoryIt}`,
      ru: `Модель ${modelName} от Luisa Spagnoli переосмысливает категорию «${sil}» через призму сдержанной роскоши и вневременного итальянского стиля. Безупречный крой и внимание к каждой детали гарантируют идеальную посадку, подчеркивающую женственность и статус. ${techStoryRu}`,
      en: `The ${modelName} style by Luisa Spagnoli reinterprets the ${sil} category through the lens of refined Italian quiet luxury. Precision tailoring and prestigious textiles sculpt a silhouette that flows effortlessly. ${techStoryEn}`,
      pl: `Model ${modelName} od Luisa Spagnoli na nowo definiuje kategorię ${sil} poprzez pryzmat dyskretnego luksusu. Precyzyjne krawiectwo i wyselekcjonowane szlachetne tkaniny zapewniają idealne dopasowanie do sylwetki. ${techStoryPl}`,
    },
    colors: defaultColors,
    stylingLooks: {
      it: [
        {
          title: 'Total Look Vetrine & Lookbook (Giorno)',
          itemsListText: `${modelName}, Cremina 2331, Ulisside 2240, Iago 2240, Nagorno 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Pezzo chiave' },
            {
              name: 'Cremina 2331',
              image: '/assets/training/look_cremina_cammello.png',
              role: 'Gilet in lana con cappuccio',
            },
            {
              name: 'Ulisside 2240',
              image: '/assets/training/look_ulisside_cammello.png',
              role: 'Stivale in pelle alto',
            },
            {
              name: 'Iago 2240',
              image: '/assets/training/look_iago.png',
              role: 'Borsa a tracolla iconica',
            },
            {
              name: 'Nagorno 0002',
              image: '/assets/training/look_nagorno.png',
              role: 'Orecchini a nodo dorati',
            },
          ],
        },
        {
          title: 'Total Look Runway & Serata (Notte)',
          itemsListText: `${modelName}, Fabula 0101, Ulisside 0101, Neanide 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Pezzo chiave' },
            {
              name: 'Fabula 0101',
              image: '/assets/training/look_fabula.png',
              role: 'Gonna fluida sartoriale',
            },
            {
              name: 'Ulisside 0101',
              image: '/assets/training/look_ulisside_nero.png',
              role: 'Stivale cuoio nero lucido',
            },
            {
              name: 'Neanide 0002',
              image: '/assets/training/look_neanide.png',
              role: 'Orecchini a doppio cerchio dorato',
            },
          ],
        },
      ],
      ru: [
        {
          title: 'Total Look Витрины & Лукбук (Дневной)',
          itemsListText: `${modelName}, Cremina 2331, Ulisside 2240, Iago 2240, Nagorno 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Ключевой элемент' },
            {
              name: 'Cremina 2331',
              image: '/assets/training/look_cremina_cammello.png',
              role: 'Шерстяной жилет с капюшоном',
            },
            {
              name: 'Ulisside 2240',
              image: '/assets/training/look_ulisside_cammello.png',
              role: 'Кожаные сапоги',
            },
            {
              name: 'Iago 2240',
              image: '/assets/training/look_iago.png',
              role: 'Сумка через плечо',
            },
            {
              name: 'Nagorno 0002',
              image: '/assets/training/look_nagorno.png',
              role: 'Золотистые серьги-узлы',
            },
          ],
        },
        {
          title: 'Total Look Подиум & Вечер (Ночной)',
          itemsListText: `${modelName}, Fabula 0101, Ulisside 0101, Neanide 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Ключевой элемент' },
            {
              name: 'Fabula 0101',
              image: '/assets/training/look_fabula.png',
              role: 'Струящаяся юбка макси',
            },
            {
              name: 'Ulisside 0101',
              image: '/assets/training/look_ulisside_nero.png',
              role: 'Черные кожаные сапоги',
            },
            {
              name: 'Neanide 0002',
              image: '/assets/training/look_neanide.png',
              role: 'Серьги двойные золотые кольца',
            },
          ],
        },
      ],
      en: [
        {
          title: 'Total Look Window & Lookbook (Day)',
          itemsListText: `${modelName}, Cremina 2331, Ulisside 2240, Iago 2240, Nagorno 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Hero piece' },
            {
              name: 'Cremina 2331',
              image: '/assets/training/look_cremina_cammello.png',
              role: 'Hooded wool vest',
            },
            {
              name: 'Ulisside 2240',
              image: '/assets/training/look_ulisside_cammello.png',
              role: 'Tall riding boots',
            },
            {
              name: 'Iago 2240',
              image: '/assets/training/look_iago.png',
              role: 'Chain shoulder bag',
            },
            {
              name: 'Nagorno 0002',
              image: '/assets/training/look_nagorno.png',
              role: 'Gold knot earrings',
            },
          ],
        },
        {
          title: 'Total Look Runway & Evening (Night)',
          itemsListText: `${modelName}, Fabula 0101, Ulisside 0101, Neanide 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Hero piece' },
            {
              name: 'Fabula 0101',
              image: '/assets/training/look_fabula.png',
              role: 'Flowing midi skirt',
            },
            {
              name: 'Ulisside 0101',
              image: '/assets/training/look_ulisside_nero.png',
              role: 'Polished black boots',
            },
            {
              name: 'Neanide 0002',
              image: '/assets/training/look_neanide.png',
              role: 'Double hoop gold earrings',
            },
          ],
        },
      ],
      pl: [
        {
          title: 'Total Look Witryny & Lookbook (Dzień)',
          itemsListText: `${modelName}, Cremina 2331, Ulisside 2240, Iago 2240, Nagorno 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Główny model' },
            {
              name: 'Cremina 2331',
              image: '/assets/training/look_cremina_cammello.png',
              role: 'Kamizelka wełniana z kapturem',
            },
            {
              name: 'Ulisside 2240',
              image: '/assets/training/look_ulisside_cammello.png',
              role: 'Wysokie skórzane kozaki',
            },
            {
              name: 'Iago 2240',
              image: '/assets/training/look_iago.png',
              role: 'Torebka na ramię ze złotym łańcuszkiem',
            },
            {
              name: 'Nagorno 0002',
              image: '/assets/training/look_nagorno.png',
              role: 'Złote kolczyki węzły',
            },
          ],
        },
        {
          title: 'Total Look Pokaz & Wieczór (Noc)',
          itemsListText: `${modelName}, Fabula 0101, Ulisside 0101, Neanide 0002.`,
          items: [
            { name: modelName, image: hero, role: 'Główny model' },
            {
              name: 'Fabula 0101',
              image: '/assets/training/look_fabula.png',
              role: 'Zwiewna spódnica midi',
            },
            {
              name: 'Ulisside 0101',
              image: '/assets/training/look_ulisside_nero.png',
              role: 'Czarne kozaki skórzane',
            },
            {
              name: 'Neanide 0002',
              image: '/assets/training/look_neanide.png',
              role: 'Podwójne złote kolczyki',
            },
          ],
        },
      ],
    },
    salesTips: {
      it: [
        `Esaltare la vestibilità: il taglio studiato del modello ${modelName} slancia la silhouette valorizzando la figura con naturale disinvoltura.`,
        'Proporre come pezzo icona trasversale: si adatta con facilità dal contesto business ai momenti di svago raffinato cambiando semplicemente gli accessori.',
        'Spiegare la cura dei dettagli artigianali: la precisione delle cuciture e la qualità dei tessuti Luisa Spagnoli garantiscono una tenuta impeccabile nel tempo.',
      ],
      ru: [
        `Подчеркивайте силуэт: безупречный крой модели ${modelName} визуально удлиняет фигуру и дарит максимальный комфорт в движении.`,
        'Рекомендуйте как ключевую инвестицию: изделие легко трансформируется из делового образа в вечерний при смене аксессуаров.',
        'Акцентируйте внимание на итальянском мастерстве: высочайшее качество швов и обработка краев обеспечивают безупречный вид на многие сезоны.',
      ],
      en: [
        `Highlight silhouette sculpting: the proportioned design of ${modelName} elongates the frame while assuring ease of movement.`,
        'Position as a versatile wardrobe cornerstone: easily transitions from corporate boardroom elegance to evening cocktail glamour.',
        'Emphasize Italian artisanal heritage: fine finishing and durable fabrics maintain their structure and pristine luster over time.',
      ],
      pl: [
        `Podkreślaj sylwetkę: krój modelu ${modelName} optycznie wysmukla figurę, zapewniając wyjątkową wygodę.`,
        'Polecaj jako inwestycję na lata: z łatwością zmienia charakter ze stylizacji biznesowej na wieczorową za sprawą dodatków.',
        'Zwracaj uwagę na włoskie rzemiosło: perfekcyjne wykończenia i jakość Luisa Spagnoli zachowują nienaganny wygląd przez lata.',
      ],
    },
    objections: {
      it: [
        {
          objection: 'Il capo richiede cure delicate per il mantenimento?',
          response:
            'Le fibre di pregio selezionate da Luisa Spagnoli mantengono la loro consistenza e brillantezza nel tempo seguendo le indicazioni per il lavaggio delicato o il dry cleaning specializzato.',
        },
        {
          objection: 'Il prezzo riflette il valore reale del prodotto?',
          response:
            'Assolutamente: la lavorazione sartoriale Made in Italy, i filati ricercati e l\'esclusività del design Luisa Spagnoli rendono questo capo un investimento duraturo e di altissimo prestigio.',
        },
        {
          objection: 'Non sono sicura di come abbinarlo nel mio guardaroba attuale',
          response:
            'I nostri lookbook propongono combinazioni versatili con capispalla neutri e gonne materiche; la palette cromatica è appositamente studiata per armonizzarsi con i classici del guardaroba.',
        },
      ],
      ru: [
        {
          objection: 'Требует ли изделие сложного деликатного ухода?',
          response:
            'Высококачественные волокна Luisa Spagnoli сохраняют мягкость и яркость при следовании рекомендациям по бережному уходу и сухой чистке.',
        },
        {
          objection: 'Соответствует ли цена ценности изделия?',
          response:
            'Безусловно: итальянское производство, благородные ткани и вневременной дизайн делают эту вещь выгодной инвестицией в статусный гардероб.',
        },
        {
          objection: 'Сложно представить, с чем сочетать в повседневной жизни',
          response:
            'Нейтральная благородная палитра и продуманный крой позволяют носить модель как с джинсами и жакетами, так и с классическими брюками или юбками.',
        },
      ],
      en: [
        {
          objection: 'Does the garment require high-maintenance care?',
          response:
            'Luisa Spagnoli noble textiles are specially treated to retain structure and hand feel over time with standard delicate dry cleaning.',
        },
        {
          objection: 'Is the price justified for this silhouette?',
          response:
            'Unquestionably: 100% Italian craftsmanship, refined textile selection, and timeless pattern-making make it an enduring investment piece.',
        },
        {
          objection: 'Not sure how to incorporate into existing wardrobe',
          response:
            'The color palette and streamlined fit were conceived to effortlessly blend with foundational basics like tailored trousers and soft knits.',
        },
      ],
      pl: [
        {
          objection: 'Czy model wymaga skomplikowanej pielęgnacji?',
          response:
            'Szlachetne włókna Luisa Spagnoli zachowują sprężystość i blask przy standardowym delikatnym czyszczeniu chemicznym.',
        },
        {
          objection: 'Czy cena odzwierciedla wartość produktu?',
          response:
            'Zdecydowanie: produkcja Made in Italy, ekskluzywne tkaniny i ponadczasowy krój czynią ten model inwestycją na lata.',
        },
        {
          objection: 'Nie mam pewności, z czym łączyć ten fason',
          response:
            'Klasyczna paleta barw i uniwersalny fason pozwalają na swobodne zestawianie zarówno z eleganckimi spodniami, jak i ze spódnicami.',
        },
      ],
    },
  };
}

/**
 * Generates raw standalone HTML strictly adhering to the user prompt instructions:
 * 
 * ANALISI [NOME MODELLO] (Titolo elegante)
 * DESCRIZIONE : Recupera dalla fonte C nel JSON...
 * VARIANTI COLORE : Elenca i colori dalla fonte E...
 * STYLING & VETRINE : Combina i dati della fonte D (Lookbook) e della fonte 4 (Vetrine)...
 * RECOLA IMMAGINI: Ogni volta che citi un modello (es. Cassina) o un abbinamento (es. Pantaloni Olivetano),
 * devi inserire IMMEDIATAMENTE dopo il nome l'immagine corrispondente recuperata dall'URL:
 * <img src="URL_IMMAGINE" style="width:120px; border-radius:4px; margin:5px;">.
 * CONSIGLI DI VENDITA : Trasforma le caratteristiche in benefici...
 * GESTIONE OBIEZIONI : Crea una tabella HTML con le obiezioni e le risposte strategiche.
 */
export function generateTrainingHtmlOutput(
  data: ModelTrainingData,
  lang: TrainingLanguage = 'it',
  products: MergedProduct[] = [],
  orders: OrderItem[] = []
): string {
  const titles = {
    it: {
      analysis: `ANALISI ${data.modelName.toUpperCase()}`,
      desc: 'DESCRIZIONE',
      colors: 'VARIANTI COLORE',
      styling: 'STYLING & VETRINE',
      sales: 'CONSIGLI DI VENDITA',
      objections: 'GESTIONE OBIEZIONI',
      objCol: 'Obiezione della Cliente',
      respCol: 'Risposta Strategica',
    },
    en: {
      analysis: `ANALYSIS ${data.modelName.toUpperCase()}`,
      desc: 'DESCRIPTION',
      colors: 'COLOR VARIANTS',
      styling: 'STYLING & SHOWCASES',
      sales: 'SELLING TIPS',
      objections: 'OBJECTION HANDLING',
      objCol: 'Customer Objection',
      respCol: 'Strategic Response',
    },
    ru: {
      analysis: `АНАЛИЗ ${data.modelName.toUpperCase()}`,
      desc: 'ОПИСАНИЕ',
      colors: 'ВАРИАНТЫ ЦВЕТА',
      styling: 'СТАЙЛИНГ И СОЧЕТАНИЯ',
      sales: 'СОВЕТЫ ПО ПРОДАЖАМ',
      objections: 'УПРАВЛЕНИЕ ВОЗРАЖЕНИЯМИ',
      objCol: 'Возражение клиента',
      respCol: 'Стратегический ответ',
    },
    pl: {
      analysis: `ANALIZA ${data.modelName.toUpperCase()}`,
      desc: 'OPIS',
      colors: 'WARIANTY KOLORYSTYCZNE',
      styling: 'STYLIZACJA I WITRYNY',
      sales: 'WSKAZÓWKI SPRZEDAŻOWE',
      objections: 'ZARZĄDZANIE OBIEKCJAMI',
      objCol: 'Obiekcja Klientki',
      respCol: 'Strategiczna Odpowiedź',
    },
  }[lang];

  const colorsHtml = data.colors
    .map(
      (c) =>
        `<span><strong>${c.name[lang]} (${c.code})</strong> <img src="${c.image}" style="width:120px; border-radius:4px; margin:5px;" alt="${c.name[lang]}"></span>`
    )
    .join(' &nbsp; ');

  const stylingHtml = data.stylingLooks[lang]
    .map((look) => {
      const itemsWithImgs = look.items
        .map((item) => {
          const status = checkModelStockAndOrderStatus(item.name, products, orders);
          const labels = formatAvailabilityLabels(status, lang);
          const badgeBg = status.isAvailable ? '#f0fdf4' : status.isOrdered ? '#fef2f2' : '#f5f5f4';
          const badgeColor = status.isAvailable ? '#166534' : status.isOrdered ? '#991b1b' : '#57534e';
          const badgeBorder = status.isAvailable ? '#bbf7d0' : status.isOrdered ? '#fecaca' : '#e7e5e4';

          return `<div style="display:inline-block; margin:6px; vertical-align:top; border:1px solid #e7e5e4; border-radius:6px; padding:8px; background:#fff; text-align:center; max-width:140px;">
            <strong style="font-size:12px; display:block; margin-bottom:2px;">${item.name}</strong>
            <img src="${item.image}" style="width:120px; height:140px; object-fit:contain; border-radius:4px; margin:4px 0;" alt="${item.name}">
            <div style="font-size:10px; margin-top:3px; padding:2px 4px; border-radius:3px; background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-weight:600;">
              ${labels.orderedBadge}
            </div>
            <div style="font-size:10px; margin-top:2px; color:#444;">
              ${labels.availabilityBadge}
            </div>
          </div>`;
        })
        .join('');

      return `<div style="margin-bottom:18px;">
        <h4 style="margin:6px 0; color:#5c4033; font-size:14px; font-weight:bold;">${look.title}</h4>
        <p style="margin:4px 0 8px 0; font-size:13px; color:#444;">${look.itemsListText}</p>
        <div style="display:flex; flex-wrap:wrap; align-items:flex-start; gap:8px;">${itemsWithImgs}</div>
      </div>`;
    })
    .join('');

  const tipsHtml = `<ol style="margin-top:6px; padding-left:20px; line-height:1.6; font-size:13px; color:#333;">${data.salesTips[
    lang
  ]
    .map((tip) => `<li style="margin-bottom:6px;">${tip}</li>`)
    .join('')}</ol>`;

  const objectionsHtml = `<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:13px; border-color:#e5e7eb; margin-top:8px;">
  <thead>
    <tr style="background-color:#f9fafb; text-align:left; color:#374151;">
      <th style="padding:10px; width:40%;">${titles.objCol}</th>
      <th style="padding:10px; width:60%;">${titles.respCol}</th>
    </tr>
  </thead>
  <tbody>
    ${data.objections[lang]
      .map(
        (obj) =>
          `<tr>
        <td style="padding:10px; font-weight:600; color:#1f2937; background-color:#ffffff; vertical-align:top;">${obj.objection}</td>
        <td style="padding:10px; color:#4b5563; background-color:#ffffff; vertical-align:top;">${obj.response}</td>
      </tr>`
      )
      .join('')}
  </tbody>
</table>`;

  return `<div style="font-family:'Georgia', serif; color:#1c1917; max-width:850px; margin:0 auto; padding:20px; background:#fff;">
  <div style="border-bottom:1px solid #d6d3d1; padding-bottom:12px; margin-bottom:18px;">
    <div style="font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#78716c;">LUISA SPAGNOLI · ${data.season[lang]}</div>
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
      <h2 style="margin:0; font-size:26px; font-weight:normal; letter-spacing:0.5px; color:#1c1917;">${titles.analysis}</h2>
      <span style="font-family:monospace; font-size:13px; color:#a8a29e;">${data.modelId}</span>
    </div>
  </div>

  <div style="text-align:center; margin-bottom:20px;">
    <img src="${data.heroImage}" style="max-height:360px; object-fit:contain; border-radius:6px; border:1px solid #f5f5f4;" alt="${data.modelName}">
  </div>

  <div style="margin-bottom:20px;">
    <h3 style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#854d0e; border-bottom:1px solid #fef08a; padding-bottom:4px; margin-bottom:8px;">${titles.desc}</h3>
    <p style="font-size:13.5px; line-height:1.65; color:#292524; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${data.description[lang]}</p>
  </div>

  <div style="margin-bottom:20px;">
    <h3 style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#854d0e; border-bottom:1px solid #fef08a; padding-bottom:4px; margin-bottom:8px;">${titles.colors}</h3>
    <div style="font-size:13px; color:#292524; line-height:1.8;">${colorsHtml}</div>
  </div>

  <div style="margin-bottom:20px;">
    <h3 style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#854d0e; border-bottom:1px solid #fef08a; padding-bottom:4px; margin-bottom:8px;">${titles.styling}</h3>
    ${stylingHtml}
  </div>

  <div style="margin-bottom:20px;">
    <h3 style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#854d0e; border-bottom:1px solid #fef08a; padding-bottom:4px; margin-bottom:8px;">${titles.sales}</h3>
    ${tipsHtml}
  </div>

  <div style="margin-bottom:10px;">
    <h3 style="font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#854d0e; border-bottom:1px solid #fef08a; padding-bottom:4px; margin-bottom:8px;">${titles.objections}</h3>
    ${objectionsHtml}
  </div>
</div>`;
}
