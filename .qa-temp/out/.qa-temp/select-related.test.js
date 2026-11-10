"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_categories_1 = require("../lib/service-categories");
function category(partial) {
    return {
        tagline: '',
        description: '',
        image: '',
        icon: '',
        productCount: 0,
        ...partial,
    };
}
const artWork = category({
    id: '592a868f-0055-4702-8dc7-89733c4fc5c0',
    slug: 'art-work',
    name: 'Art Work',
    mainSection: 'metal_services',
    isPublished: true,
});
const draft = category({
    id: 'draft-id',
    slug: 'draft-category',
    name: 'Draft',
    mainSection: 'metal_services',
    isPublished: false,
});
const homeDecor = category({
    id: 'home-id',
    slug: 'home-category',
    name: 'Home Category',
    mainSection: 'home_decor',
    isPublished: true,
});
const result = (0, service_categories_1.selectRelatedMetalCategories)([artWork, draft, homeDecor, { ...artWork }], ['missing-id', 'draft-id', 'home-id', artWork.id, artWork.id]);
console.log(JSON.stringify(result.map((item) => item.slug)));
if (result.length !== 1 || result[0].slug !== 'art-work') {
    console.error('Related category selection failed.');
    process.exit(1);
}
console.log('RELATED_CATEGORY_SELECTION_OK');
