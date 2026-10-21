package com._42students.lms.util;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reusable Fuzzy Search Utility
 * Can be used for any entity type - Skills, Users, Courses, Jobs, etc.
 * 
 * Features:
 * - Levenshtein distance for typo tolerance
 * - Prefix/contains matching
 * - Synonym expansion
 * - Weighted scoring
 * 
 * Usage:
 * <pre>
 * List<User> results = FuzzySearchUtil.fuzzySearch(
 *     allUsers,
 *     "john",
 *     user -> user.getName(),
 *     2,  // max distance
 *     10  // limit
 * );
 * </pre>
 */
public class FuzzySearchUtil {
    
    /**
     * Perform fuzzy search on a list of items
     * 
     * @param items List of items to search
     * @param query Search query
     * @param textExtractor Function to extract searchable text from item
     * @param maxDistance Maximum Levenshtein distance (1-3 recommended)
     * @param limit Maximum results to return
     * @param <T> Type of items
     * @return Sorted list of matching items (best matches first)
     */
    public static <T> List<T> fuzzySearch(
            List<T> items,
            String query,
            Function<T, String> textExtractor,
            int maxDistance,
            int limit) {
        
        if (query == null || query.trim().isEmpty()) {
            return items.stream().limit(limit).collect(Collectors.toList());
        }
        
        String normalizedQuery = query.toLowerCase().trim();
        
        return items.stream()
            .map(item -> {
                String text = textExtractor.apply(item);
                if (text == null) text = "";
                String normalizedText = text.toLowerCase();
                
                int score = calculateMatchScore(normalizedQuery, normalizedText);
                return new ScoredItem<>(item, score);
            })
            .filter(scored -> scored.score >= 0)
            .sorted(Comparator.comparingInt((ScoredItem<T> s) -> -s.score))
            .limit(limit)
            .map(scored -> scored.item)
            .collect(Collectors.toList());
    }
    
    /**
     * Perform fuzzy search with multiple text fields
     * 
     * @param items List of items to search
     * @param query Search query
     * @param textExtractors List of functions to extract searchable text
     * @param maxDistance Maximum Levenshtein distance
     * @param limit Maximum results
     * @param <T> Type of items
     * @return Sorted list of matching items
     */
    public static <T> List<T> fuzzySearchMultiField(
            List<T> items,
            String query,
            List<Function<T, String>> textExtractors,
            int maxDistance,
            int limit) {
        
        if (query == null || query.trim().isEmpty()) {
            return items.stream().limit(limit).collect(Collectors.toList());
        }
        
        String normalizedQuery = query.toLowerCase().trim();
        
        return items.stream()
            .map(item -> {
                int bestScore = -1;
                for (Function<T, String> extractor : textExtractors) {
                    String text = extractor.apply(item);
                    if (text != null) {
                        int score = calculateMatchScore(normalizedQuery, text.toLowerCase());
                        bestScore = Math.max(bestScore, score);
                    }
                }
                return new ScoredItem<>(item, bestScore);
            })
            .filter(scored -> scored.score >= 0)
            .sorted(Comparator.comparingInt((ScoredItem<T> s) -> -s.score))
            .limit(limit)
            .map(scored -> scored.item)
            .collect(Collectors.toList());
    }
    
    /**
     * Calculate match score for a query against text
     * Higher score = better match
     * 
     * @return Score (100=exact, 80=prefix, 50=contains, 30=fuzzy, -1=no match)
     */
    public static int calculateMatchScore(String query, String text) {
        if (text == null || text.isEmpty()) return -1;
        
        // Exact match
        if (text.equals(query)) return 100;
        
        // Starts with query
        if (text.startsWith(query)) return 80;
        
        // Contains query
        if (text.contains(query)) return 50;
        
        // Word starts with query
        String[] words = text.split("\\s+");
        for (String word : words) {
            if (word.startsWith(query)) return 60;
        }
        
        // Fuzzy match (Levenshtein distance <= 2)
        int distance = levenshteinDistance(query, text);
        if (distance <= 2) return 30 - distance * 5;
        
        // Check first word fuzzy match
        if (words.length > 0) {
            distance = levenshteinDistance(query, words[0]);
            if (distance <= 2) return 25 - distance * 5;
        }
        
        return -1; // No match
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     */
    public static int levenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) return Integer.MAX_VALUE;
        if (s1.equals(s2)) return 0;
        if (s1.isEmpty()) return s2.length();
        if (s2.isEmpty()) return s1.length();
        
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
    
    /**
     * Expand common synonyms/abbreviations
     */
    public static String expandSynonym(String query, Map<String, String> synonyms) {
        if (synonyms == null) return query;
        return synonyms.getOrDefault(query.toLowerCase(), query);
    }
    
    /**
     * Helper class for scored items
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


