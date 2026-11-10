"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceWhatsAppMessage = exports.getServiceQuoteHref = exports.getServiceApplications = exports.getServiceBenefits = exports.getServiceOverviewParagraphs = exports.getServiceOverviewHeading = exports.getServiceHeroTitle = void 0;
/**
 * Supporting copy is deliberately neutral. Benefit titles and application
 * names come from the published CMS service record; this module never invents
 * technical performance claims.
 */
const BENEFIT_SUPPORT = [
    'Included as part of this finishing service.',
    'Assessed against your component and finish requirements.',
    'Confirmed during project review before processing.',
];
const APPLICATION_SUPPORT = [
    'A typical application area for this finishing service.',
    'Discussed as part of the project assessment.',
    'Reviewed against the component and intended use.',
];
const APPLICATION_IMAGE_RULES = [
    {
        pattern: /worn|aged|weather|rust|corrosion|degraded|restor/i,
        images: ['/before-metal-worn.jpg', '/after-metal-polished.jpg'],
    },
    {
        pattern: /polish|burnish|ornate|antique|patina/i,
        images: ['/after-metal-polished.jpg', '/before-metal-worn.jpg'],
    },
    {
        pattern: /sculpture|sculptural|ornament|display|artwork|\bart\b|wall feature|wall art|mural/i,
        images: [
            '/homedecor.jpeg',
            '/hero-metal-art-decor.jpg',
            '/after-metal-polished.jpg',
        ],
    },
    {
        pattern: /partition|screen|divider/i,
        images: [
            '/hero-metal-art-decor.jpg',
            '/homedecor.jpeg',
            '/homedecor2.jpeg',
        ],
    },
    {
        pattern: /\bfurniture\b|\btable\b|\bchair\b|\bcabinet\b|\bjoinery\b|\bbase\b/i,
        images: [
            '/homedecor2.jpeg',
            '/after-metal-polished.jpg',
            '/homedecor.jpeg',
        ],
    },
    {
        pattern: /fabricat|weld|frame|rail|railing|structure|enclosure|industrial|grill|gate/i,
        images: [
            '/metal.jpg',
            '/materials-steel.jpg',
            '/materials-aluminium.jpg',
            '/hero-coating-process.jpg',
        ],
    },
    {
        pattern: /hardware|fitting|fixture|accessor/i,
        images: [
            '/after-metal-polished.jpg',
            '/hero-brass-interior.jpg',
            '/homedecor2.jpeg',
        ],
    },
    {
        pattern: /interior|architectural|accent/i,
        images: [
            '/hero-brass-interior.jpg',
            '/homedecor2.jpeg',
            '/hero-metal-art-decor.jpg',
        ],
    },
    {
        pattern: /decorative|decor\b/i,
        images: [
            '/homedecor.jpeg',
            '/hero-metal-art-decor.jpg',
            '/after-metal-polished.jpg',
        ],
    },
    {
        pattern: /aluminium|aluminum/i,
        images: ['/materials-aluminium.jpg', '/materials-steel.jpg'],
    },
    {
        pattern: /wood|timber/i,
        images: ['/materials-wood.jpg'],
    },
    {
        pattern: /pvc|plastic|polymer/i,
        images: ['/materials-pvc.jpg'],
    },
    {
        pattern: /steel|stainless|metal|component|surface|sheet|plate|trim|border|panel/i,
        images: [
            '/materials-steel.jpg',
            '/materials-aluminium.jpg',
            '/metal.jpg',
        ],
    },
    {
        pattern: /coating|spray|paint|finish/i,
        images: ['/hero-coating-process.jpg', '/materials-aluminium.jpg'],
    },
];
const APPLICATION_IMAGE_POOL = [
    '/materials-steel.jpg',
    '/materials-aluminium.jpg',
    '/hero-brass-interior.jpg',
    '/hero-metal-art-decor.jpg',
    '/homedecor.jpeg',
    '/homedecor2.jpeg',
    '/after-metal-polished.jpg',
    '/metal.jpg',
    '/hero-coating-process.jpg',
];
function getServiceHeroTitle(service) {
    return /solutions$/i.test(service.name.trim())
        ? service.name
        : `${service.name} Solutions`;
}
exports.getServiceHeroTitle = getServiceHeroTitle;
function getServiceOverviewHeading(service) {
    return `Understanding ${service.name}`;
}
exports.getServiceOverviewHeading = getServiceOverviewHeading;
function getServiceOverviewParagraphs(service) {
    const source = (service.longDescription || service.description || '').trim();
    if (!source)
        return [];
    return source
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}
exports.getServiceOverviewParagraphs = getServiceOverviewParagraphs;
function getServiceBenefits(service, limit = 3) {
    var _a;
    return ((_a = service.features) !== null && _a !== void 0 ? _a : [])
        .map((feature) => feature === null || feature === void 0 ? void 0 : feature.trim())
        .filter((feature) => Boolean(feature))
        .slice(0, limit)
        .map((title, index) => ({
        title,
        description: BENEFIT_SUPPORT[index % BENEFIT_SUPPORT.length],
    }));
}
exports.getServiceBenefits = getServiceBenefits;
function resolveApplicationImages(text, fallback) {
    const candidates = [];
    const add = (image) => {
        if (!candidates.includes(image))
            candidates.push(image);
    };
    APPLICATION_IMAGE_RULES.forEach((rule) => {
        if (rule.pattern.test(text))
            rule.images.forEach(add);
    });
    add(fallback);
    APPLICATION_IMAGE_POOL.forEach(add);
    return candidates;
}
function getServiceApplications(service) {
    var _a;
    const fallback = service.image || '/materials-steel.jpg';
    const usedImages = new Set();
    return ((_a = service.applications) !== null && _a !== void 0 ? _a : [])
        .map((application) => application === null || application === void 0 ? void 0 : application.trim())
        .filter((application) => Boolean(application))
        .map((title, index) => {
        var _a, _b;
        const candidates = resolveApplicationImages(title, fallback);
        const image = (_b = (_a = candidates.find((candidate) => !usedImages.has(candidate))) !== null && _a !== void 0 ? _a : candidates[0]) !== null && _b !== void 0 ? _b : fallback;
        usedImages.add(image);
        return {
            title,
            description: APPLICATION_SUPPORT[index % APPLICATION_SUPPORT.length],
            image,
            alt: `${title} — ${service.name}`,
        };
    });
}
exports.getServiceApplications = getServiceApplications;
function getServiceQuoteHref(service) {
    return `/metal-coating?service=${encodeURIComponent(service.slug)}#quote`;
}
exports.getServiceQuoteHref = getServiceQuoteHref;
function getServiceWhatsAppMessage(service) {
    return `Hello RTMETALCOATING, I am interested in ${service.name}. I would like to discuss my requirements and request a quotation.`;
}
exports.getServiceWhatsAppMessage = getServiceWhatsAppMessage;
