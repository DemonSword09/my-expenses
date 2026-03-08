import { CategoryRepo } from '../../db/repositories/CategoryRepo';
import { Category } from '../../db/models';
import { parseDateRange } from '../../utils/date-utils';

interface TransactionFilters {
    categoryId?: string;
    categoryIds?: string[];
    accountId?: string;
    payeeId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
}

interface CategoryMatch {
    category: Category;
    score: number;
    matchType: 'exact' | 'startsWith' | 'contains' | 'fuzzy';
}

/**
 * Find category by name with fuzzy matching
 * Priority: exact match > starts with > contains > fuzzy
 */
async function findCategoryByName(name: string): Promise<Category | undefined> {
    const categories = await CategoryRepo.listAll();
    const query = name.toLowerCase().trim();

    if (!query) return undefined;

    const matches: CategoryMatch[] = [];

    for (const cat of categories) {
        const label = cat.label.toLowerCase();

        // Exact match (highest priority)
        if (label === query) {
            return cat; // Return immediately for exact match
        }

        // Starts with (e.g., "hair" matches "haircut")
        if (label.startsWith(query)) {
            matches.push({ category: cat, score: 0.9, matchType: 'startsWith' });
            continue;
        }

        // Contains (e.g., "cut" matches "haircut")
        if (label.includes(query)) {
            matches.push({ category: cat, score: 0.7, matchType: 'contains' });
            continue;
        }

        // Query contains label (e.g., "haircut appointment" matches "haircut")
        if (query.includes(label)) {
            matches.push({ category: cat, score: 0.8, matchType: 'contains' });
            continue;
        }

        // Fuzzy: check if most characters match (for typos)
        const similarity = calculateSimilarity(query, label);
        if (similarity > 0.6) {
            matches.push({ category: cat, score: similarity * 0.6, matchType: 'fuzzy' });
        }
    }

    // Sort by score and return best match
    if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        const best = matches[0];
        console.log(`[FilterBuilder] Category match: "${name}" → "${best.category.label}" (${best.matchType}, ${(best.score * 100).toFixed(0)}%)`);
        return best.category;
    }

    console.log(`[FilterBuilder] No category match for: "${name}"`);
    return undefined;
}

/**
 * Simple string similarity (Sørensen–Dice coefficient)
 */
function calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const getBigrams = (s: string): Set<string> => {
        const bigrams = new Set<string>();
        for (let i = 0; i < s.length - 1; i++) {
            bigrams.add(s.substring(i, i + 2));
        }
        return bigrams;
    };

    const bigramsA = getBigrams(a);
    const bigramsB = getBigrams(b);

    let intersection = 0;
    for (const bigram of bigramsA) {
        if (bigramsB.has(bigram)) intersection++;
    }

    return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

async function getCategoryFamilyIds(rootId: string): Promise<string[]> {
    // Get category and its children for hierarchical matching
    const categories = await CategoryRepo.listAll();
    const family = [rootId];

    // Find children (categories with this as parent)
    for (const cat of categories) {
        if (cat.parentId === rootId) {
            family.push(cat.id);
        }
    }

    return family;
}

export async function buildFiltersFromSlots(
    slots: any,
    text: string
): Promise<TransactionFilters> {
    const filters: TransactionFilters = {};

    // === Date Extraction ===
    if (slots.date) {
        const dateRange = parseDateRange(slots.date) || parseDateRange(text);
        if (dateRange) {
            filters.startDate = dateRange.start;
            filters.endDate = dateRange.end;
            console.log(`[FilterBuilder] Date filter: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`);
        }
    } else {
        const dateRange = parseDateRange(text);
        if (dateRange) {
            filters.startDate = dateRange.start;
            filters.endDate = dateRange.end;
            console.log(`[FilterBuilder] Date filter (from text): ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`);
        }
    }

    // === Category Extraction ===
    if (slots.category || slots.subCategory) {
        const query = slots.category || slots.subCategory;
        const category = await findCategoryByName(query);
        if (category) {
            filters.categoryId = category.id;
            const familyIds = await getCategoryFamilyIds(category.id);
            filters.categoryIds = familyIds;

            // Log with names for debugging
            const categories = await CategoryRepo.listAll();
            const familyNames = familyIds.map(id => {
                const cat = categories.find(c => c.id === id);
                return cat?.label || id;
            });
            console.log(`[FilterBuilder] Category: "${category.label}" + children: [${familyNames.join(', ')}]`);
        }
    } else {
        // Try to extract category from raw text if ML didn't catch it
        const categoryFromText = await extractCategoryFromText(text);
        if (categoryFromText) {
            filters.categoryId = categoryFromText.id;
            filters.categoryIds = await getCategoryFamilyIds(categoryFromText.id);
            console.log(`[FilterBuilder] Category from text: "${categoryFromText.label}"`);
        }
    }

    // Log readable summary
    const categories = await CategoryRepo.listAll();
    const catName = filters.categoryId ? categories.find(c => c.id === filters.categoryId)?.label : null;
    const dateDesc = filters.startDate && filters.endDate
        ? `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
        : 'all time';
    console.log(`[FilterBuilder] Summary: ${catName ? `"${catName}"` : 'all categories'} | ${dateDesc}`);

    return filters;
}

/**
 * Try to extract category from raw text by checking against known categories
 */
async function extractCategoryFromText(text: string): Promise<Category | undefined> {
    const categories = await CategoryRepo.listAll();
    const lower = text.toLowerCase();

    // Check if any category name appears in the text
    for (const cat of categories) {
        const label = cat.label.toLowerCase();
        // Look for the category as a word boundary
        const regex = new RegExp(`\\b${escapeRegex(label)}\\b`, 'i');
        if (regex.test(lower)) {
            console.log(`[FilterBuilder] Category extracted from text: "${cat.label}"`);
            return cat;
        }
    }

    return undefined;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
