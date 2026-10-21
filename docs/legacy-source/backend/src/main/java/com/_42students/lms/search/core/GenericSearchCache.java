package com._42students.lms.search.core;

import com._42students.lms.util.FuzzySearchUtil;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Generic Reusable Search Cache
 * 
 * Provides fast in-memory search for any entity type.
 * Supports fuzzy matching, synonym expansion, weighted ranking, and popularity tracking.
 * 
 * Usage:
 * <pre>
 * public class CourseSearchCache extends GenericSearchCache&lt;CourseDTO&gt; {
 *     @Override
 *     protected void configure() {
 *         setSearchFields(CourseDTO::getCourseName, CourseDTO::getShortTitle);
 *         addSynonym("cs", "computer science");
 *     }
 * }
 * </pre>
 * 
 * @param <T> The DTO type that implements SearchableDTO
 */
@Slf4j
public abstract class GenericSearchCache<T extends SearchableDTO> {
    
    // Core data storage
    protected List<T> allItems = new ArrayList<>();
    
    // Indexes for fast lookups
    private Map<String, T> exactIndex = new ConcurrentHashMap<>();
    private Map<String, List<T>> prefixIndex = new ConcurrentHashMap<>();
    private Map<String, List<T>> categoryIndex = new ConcurrentHashMap<>();
    
    // Configuration
    private List<Function<T, String>> searchFields = new ArrayList<>();
    private Map<String, String> synonyms = new HashMap<>();
    private Function<T, Integer> popularityField;
    private Function<T, String> categoryField;
    
    // Popularity tracking
    private Map<Object, Integer> usageCounts = new ConcurrentHashMap<>();

    /**
     * Snapshot of all cached items (thread-safe copy). Use for scoped filtering in controllers.
     */
    public List<T> getAllItems() {
        synchronized (this) {
            return new ArrayList<>(allItems);
        }
    }
    
    /**
     * Configure search behavior - override in subclasses
     */
    protected abstract void configure();
    
    /**
     * Load items into cache - call this after configure(). Atomic with respect to reads.
     */
    public void load(List<T> items) {
        synchronized (this) {
            this.allItems = new ArrayList<>(items);
            buildIndexes();
            log.info("Loaded {} items into {} cache", allItems.size(), getClass().getSimpleName());
        }
    }
    
    /**
     * Set which fields to search
     */
    @SafeVarargs
    protected final void setSearchFields(Function<T, String>... fields) {
        this.searchFields = new ArrayList<>(Arrays.asList(fields));
    }
    
    /**
     * Set which fields to search (using List)
     */
    protected void setSearchFieldsList(List<Function<T, String>> fields) {
        this.searchFields = new ArrayList<>(fields);
    }
    
    /**
     * Add a synonym mapping
     */
    protected void addSynonym(String abbreviation, String fullTerm) {
        synonyms.put(abbreviation.toLowerCase(), fullTerm.toLowerCase());
    }
    
    /**
     * Set popularity field (for ranking)
     */
    protected void setPopularityField(Function<T, Integer> field) {
        this.popularityField = field;
    }
    
    /**
     * Set category field (for filtering)
     */
    protected void setCategoryField(Function<T, String> field) {
        this.categoryField = field;
    }
    
    /**
     * Main search method - combines all search strategies
     * 
     * @param query Search query
     * @param limit Maximum results
     * @return Ranked list of matching items
     */
    public List<T> search(String query, int limit) {
        synchronized (this) {
            if (query == null || query.trim().isEmpty()) {
                return getPopular(limit);
            }

            String normalizedQuery = query.trim().toLowerCase();

            // Step 1: Expand synonyms
            String expandedQuery = expandSynonyms(normalizedQuery);

            // Step 2: Try exact match
            T exact = exactIndex.get(expandedQuery);
        if (exact != null) {
            List<T> results = new ArrayList<>();
            results.add(exact);
            
            // Add prefix matches
            List<T> prefixMatches = prefixIndex.getOrDefault(
                expandedQuery.substring(0, Math.min(3, expandedQuery.length())),
                Collections.emptyList()
            );
            
            for (T item : prefixMatches) {
                if (!results.contains(item) && results.size() < limit) {
                    results.add(item);
                }
            }
            
            return results;
        }
        
        // Step 3: Prefix search
        List<T> prefixMatches = getPrefixMatches(expandedQuery);
        
        // Step 4: Score and rank results
        List<ScoredItem<T>> scored = new ArrayList<>();
        
        for (T item : prefixMatches) {
            int score = calculateScore(expandedQuery, item);
            if (score > 0) {
                scored.add(new ScoredItem<>(item, score));
            }
        }
        
        // Step 5: If few results, try fuzzy search
        if (scored.size() < 5 && normalizedQuery.length() >= 3) {
            List<T> fuzzyMatches = FuzzySearchUtil.fuzzySearch(
                allItems,
                normalizedQuery,
                T::getDisplayName,
                2,  // Max Levenshtein distance
                limit
            );
            
            for (T item : fuzzyMatches) {
                if (scored.stream().noneMatch(s -> s.item.getId().equals(item.getId()))) {
                    scored.add(new ScoredItem<>(item, 20)); // Lower score for fuzzy
                }
            }
        }
        
        // Step 6: Sort by score descending
        scored.sort((a, b) -> Integer.compare(b.score, a.score));
        
        // Step 7: Convert to list and limit
        return scored.stream()
            .limit(limit)
            .map(s -> s.item)
            .collect(Collectors.toList());
        }
    }

    /**
     * Get popular items (for empty query)
     */
    public List<T> getPopular(int limit) {
        synchronized (this) {
        if (popularityField != null) {
            return allItems.stream()
                .sorted((a, b) -> {
                    int popA = popularityField.apply(a);
                    int popB = popularityField.apply(b);
                    // Also consider usage counts
                    int usageA = usageCounts.getOrDefault(a.getId(), 0);
                    int usageB = usageCounts.getOrDefault(b.getId(), 0);
                    return Integer.compare(popB + usageB, popA + usageA);
                })
                .limit(limit)
                .collect(Collectors.toList());
        }
        
        // Fallback: return items sorted by usage count
        return allItems.stream()
            .sorted((a, b) -> {
                int usageA = usageCounts.getOrDefault(a.getId(), 0);
                int usageB = usageCounts.getOrDefault(b.getId(), 0);
                return Integer.compare(usageB, usageA);
            })
            .limit(limit)
            .collect(Collectors.toList());
        }
    }

    /**
     * Get items by category
     */
    public List<T> getByCategory(String category, int limit) {
        synchronized (this) {
            if (categoryField == null) {
                return Collections.emptyList();
            }
            return categoryIndex.getOrDefault(category.toLowerCase(), Collections.emptyList())
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
        }
    }

    /**
     * Get exact item by display name
     */
    public Optional<T> getExact(String name) {
        synchronized (this) {
            return Optional.ofNullable(exactIndex.get(name.toLowerCase()));
        }
    }

    /**
     * Check if item exists
     */
    public boolean exists(String name) {
        synchronized (this) {
            return name != null && exactIndex.containsKey(name.toLowerCase());
        }
    }
    
    /**
     * Record usage (for popularity tracking)
     */
    public void recordUsage(Object id) {
        if (id != null) {
            usageCounts.merge(id, 1, Integer::sum);
        }
    }
    
    /**
     * Get all categories
     */
    public List<String> getCategories() {
        synchronized (this) {
            return new ArrayList<>(categoryIndex.keySet());
        }
    }
    
    /**
     * Get total item count
     */
    public int size() {
        synchronized (this) {
            return allItems.size();
        }
    }
    
    /**
     * Refresh cache (reload data)
     */
    public void refresh(List<T> items) {
        load(items);
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Expand synonyms
     */
    private String expandSynonyms(String query) {
        return synonyms.getOrDefault(query, query);
    }
    
    /**
     * Get prefix matches
     */
    private List<T> getPrefixMatches(String query) {
        if (query.length() < 1) {
            return Collections.emptyList();
        }
        
        String prefix = query.substring(0, Math.min(5, query.length()));
        return prefixIndex.getOrDefault(prefix, Collections.emptyList());
    }
    
    /**
     * Calculate match score for an item
     */
    private int calculateScore(String query, T item) {
        int maxScore = 0;
        
        // Check all search fields
        for (Function<T, String> field : searchFields) {
            String value = field.apply(item);
            if (value == null) continue;
            
            String lowerValue = value.toLowerCase();
            
            // Exact match
            if (lowerValue.equals(query)) {
                maxScore = Math.max(maxScore, 100);
            }
            // Starts with
            else if (lowerValue.startsWith(query)) {
                maxScore = Math.max(maxScore, 80);
            }
            // Word starts with
            else if (lowerValue.contains(" " + query) || lowerValue.startsWith(query + " ")) {
                maxScore = Math.max(maxScore, 60);
            }
            // Contains
            else if (lowerValue.contains(query)) {
                maxScore = Math.max(maxScore, 40);
            }
        }
        
        // Boost by popularity
        if (popularityField != null) {
            int popularity = popularityField.apply(item);
            maxScore += Math.min(popularity / 10, 20); // Max 20 point boost
        }
        
        // Boost by usage count
        int usage = usageCounts.getOrDefault(item.getId(), 0);
        maxScore += Math.min(usage, 10); // Max 10 point boost
        
        return maxScore;
    }
    
    /**
     * Build indexes for fast lookups
     */
    private void buildIndexes() {
        exactIndex.clear();
        prefixIndex.clear();
        categoryIndex.clear();
        
        for (T item : allItems) {
            String displayName = item.getDisplayName();
            if (displayName == null) continue;
            
            String lowerName = displayName.toLowerCase();
            
            // Exact index
            exactIndex.put(lowerName, item);
            
            // Prefix index (first 1-5 characters)
            for (int i = 1; i <= Math.min(5, lowerName.length()); i++) {
                String prefix = lowerName.substring(0, i);
                prefixIndex.computeIfAbsent(prefix, k -> new ArrayList<>()).add(item);
            }
            
            // Also index first word
            String[] words = lowerName.split("\\s+");
            if (words.length > 0) {
                String firstWord = words[0];
                for (int i = 1; i <= Math.min(5, firstWord.length()); i++) {
                    String prefix = firstWord.substring(0, i);
                    List<T> list = prefixIndex.computeIfAbsent(prefix, k -> new ArrayList<>());
                    if (!list.contains(item)) {
                        list.add(item);
                    }
                }
            }
            
            // Category index
            if (categoryField != null) {
                String category = categoryField.apply(item);
                if (category != null) {
                    categoryIndex.computeIfAbsent(category.toLowerCase(), k -> new ArrayList<>()).add(item);
                }
            }
        }
        
        log.debug("Built indexes: {} exact, {} prefix, {} categories",
            exactIndex.size(), prefixIndex.size(), categoryIndex.size());
    }
    
    /**
     * Helper class for scoring
     */
    private static class ScoredItem<T> {
        final T item;
        final int score;
        
        ScoredItem(T item, int score) {
            this.item = item;
            this.score = score;
        }
    }
}

