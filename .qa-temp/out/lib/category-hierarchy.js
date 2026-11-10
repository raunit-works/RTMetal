"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCategoryChange = exports.getCategorySection = exports.categoryHref = exports.getCategoryPath = exports.filterCategoryProducts = exports.isCategoryInSection = exports.getDescendantSlugs = exports.getValidCategories = exports.SECTION_LABELS = void 0;
exports.SECTION_LABELS = {
    home_decor: 'Home Decor',
    metal_services: 'Metal',
};
/** Reject ambiguous IDs/slugs, orphan branches, cycles and cross-section parents. */
function getValidCategories(categories, publicOnly = true) {
    const byId = new Map(categories.filter((c) => c.id).map((c) => [c.id, c]));
    const slugCounts = new Map();
    const idCounts = new Map();
    categories.forEach((c) => {
        slugCounts.set(c.slug, (slugCounts.get(c.slug) || 0) + 1);
        if (c.id)
            idCounts.set(c.id, (idCounts.get(c.id) || 0) + 1);
    });
    return categories.filter((category) => {
        const visited = new Set();
        let current = category;
        while (current) {
            if (visited.has(current) || current.isHierarchyValid === false || !current.slug || slugCounts.get(current.slug) !== 1 ||
                (current.id && idCounts.get(current.id) !== 1) ||
                (publicOnly && current.isPublished === false))
                return false;
            visited.add(current);
            if (!current.parentId)
                return true;
            const parent = byId.get(current.parentId);
            if (!parent || parent.mainSection !== current.mainSection)
                return false;
            current = parent;
        }
        return false;
    });
}
exports.getValidCategories = getValidCategories;
function getDescendantSlugs(categories, slug) {
    const root = categories.find((category) => category.slug === slug);
    const slugs = new Set();
    const visit = (category) => {
        if (slugs.has(category.slug))
            return;
        slugs.add(category.slug);
        if (category.id)
            categories.filter((c) => c.parentId === category.id).forEach(visit);
    };
    if (root)
        visit(root);
    return slugs;
}
exports.getDescendantSlugs = getDescendantSlugs;
/** Legacy/unassigned categories keep their historical Home Decor placement; no data is reclassified. */
function isCategoryInSection(category, section) {
    return category.mainSection === section || (!category.mainSection && section === 'home_decor');
}
exports.isCategoryInSection = isCategoryInSection;
function filterCategoryProducts(products, categories, slug) {
    const valid = getValidCategories(categories);
    const allowed = slug ? getDescendantSlugs(valid, slug) : new Set(valid.map((c) => c.slug));
    const seen = new Set();
    return products.filter((product) => {
        if (product.isPublished === false || !allowed.has(product.category) || seen.has(product.id))
            return false;
        seen.add(product.id);
        return true;
    });
}
exports.filterCategoryProducts = filterCategoryProducts;
function getCategoryPath(category, categories) {
    const names = [category.name];
    const visited = new Set([category.id]);
    let parentId = category.parentId;
    while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = categories.find((c) => c.id === parentId);
        if (!parent)
            break;
        names.unshift(parent.name);
        parentId = parent.parentId;
    }
    return names.join(' / ');
}
exports.getCategoryPath = getCategoryPath;
function categoryHref(category) {
    const prefix = category.mainSection === 'metal_services' ? 'metal-coating' : 'home-decor';
    return `/${prefix}/category/${encodeURIComponent(category.slug)}`;
}
exports.categoryHref = categoryHref;
/** Resolve the division for a product from its category, keeping legacy unassigned categories in Home Decor. */
function getCategorySection(categories, slug) {
    const category = categories.find((item) => item.slug === slug);
    return category && !isCategoryInSection(category, 'home_decor')
        ? 'metal_services'
        : 'home_decor';
}
exports.getCategorySection = getCategorySection;
function validateCategoryChange(categories, change, hasAssignedProducts) {
    if (categories.some((c) => c.slug === change.slug && c.id !== change.id))
        return 'This category slug is already in use.';
    const existing = categories.find((c) => c.id === change.id);
    if (existing && existing.mainSection !== change.mainSection &&
        (hasAssignedProducts || categories.some((c) => c.parentId === existing.id))) {
        return 'A category with products or child categories cannot change section. Review its assignments first.';
    }
    if (change.parentId) {
        const parent = getValidCategories(categories, false).find((c) => c.id === change.parentId);
        if (!parent || parent.mainSection !== change.mainSection)
            return 'Choose a valid parent in the same main section.';
        if (existing && getDescendantSlugs(categories, existing.slug).has(parent.slug))
            return 'A category cannot be its own parent or a descendant of itself.';
    }
    return undefined;
}
exports.validateCategoryChange = validateCategoryChange;
