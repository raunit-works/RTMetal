"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatServiceSelectionCount = exports.formatCategorySelectionCount = exports.selectRelatedMetalCategories = exports.getMetalCategoryPickerOptions = exports.isNoServiceAssigned = exports.toggleNoServiceAssigned = exports.toggleIdSelection = exports.areIdSelectionsEqual = exports.diffIdSelections = exports.normalizeIdList = void 0;
const category_hierarchy_1 = require("./category-hierarchy");
/** Remove empty/duplicate IDs while preserving the first-seen order. */
function normalizeIdList(ids) {
    const seen = new Set();
    const normalized = [];
    for (const value of ids) {
        if (!value)
            continue;
        const id = value.trim();
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        normalized.push(id);
    }
    return normalized;
}
exports.normalizeIdList = normalizeIdList;
/** Compute the minimum set of changes between two selections. */
function diffIdSelections(current, next) {
    const currentSet = new Set(current);
    const nextSet = new Set(next);
    return {
        toAdd: next.filter((id) => !currentSet.has(id)),
        toRemove: current.filter((id) => !nextSet.has(id)),
    };
}
exports.diffIdSelections = diffIdSelections;
/** Order-insensitive comparison used for optimistic concurrency checks. */
function areIdSelectionsEqual(left, right) {
    if (left.length !== right.length)
        return false;
    const rightSet = new Set(right);
    return left.every((id) => rightSet.has(id)) && new Set(left).size === rightSet.size;
}
exports.areIdSelectionsEqual = areIdSelectionsEqual;
/** Add or remove a single checkbox selection. */
function toggleIdSelection(selected, id) {
    if (!id)
        return [...selected];
    return selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id];
}
exports.toggleIdSelection = toggleIdSelection;
/**
 * "N/A - No Service Assigned" is derived, never stored as a fake record.
 * Checking N/A clears all service selections; unchecking it is a no-op until
 * a real service is selected.
 */
function toggleNoServiceAssigned(selectedServiceIds, checked) {
    return checked ? [] : [...selectedServiceIds];
}
exports.toggleNoServiceAssigned = toggleNoServiceAssigned;
function isNoServiceAssigned(selectedServiceIds) {
    return selectedServiceIds.length === 0;
}
exports.isNoServiceAssigned = isNoServiceAssigned;
/** Build the admin Services picker from valid Metal division categories. */
function getMetalCategoryPickerOptions(categories) {
    return categories
        .filter((category) => category.id && category.mainSection === 'metal_services')
        .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: (0, category_hierarchy_1.getCategoryPath)(category, [...categories]),
        isPublished: category.isPublished !== false,
    }));
}
exports.getMetalCategoryPickerOptions = getMetalCategoryPickerOptions;
/**
 * Resolve linked IDs to publishable Metal categories, preserving the
 * relationship display order and dropping drafts, Home Decor and duplicates.
 */
function selectRelatedMetalCategories(categories, orderedCategoryIds) {
    const byId = new Map(categories
        .filter((category) => category.id)
        .map((category) => [category.id, category]));
    const seen = new Set();
    const related = [];
    for (const categoryId of orderedCategoryIds) {
        if (seen.has(categoryId))
            continue;
        const category = byId.get(categoryId);
        if (!category)
            continue;
        if (category.mainSection !== 'metal_services')
            continue;
        if (category.isPublished === false)
            continue;
        seen.add(categoryId);
        related.push(category);
    }
    return related;
}
exports.selectRelatedMetalCategories = selectRelatedMetalCategories;
function formatCategorySelectionCount(count) {
    return `${count} categor${count === 1 ? 'y' : 'ies'} selected`;
}
exports.formatCategorySelectionCount = formatCategorySelectionCount;
function formatServiceSelectionCount(count) {
    return `${count} service${count === 1 ? '' : 's'} selected`;
}
exports.formatServiceSelectionCount = formatServiceSelectionCount;
