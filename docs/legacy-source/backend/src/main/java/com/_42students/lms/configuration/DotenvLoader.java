package com._42students.lms.configuration;

import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.boot.SpringApplication;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Automatically loads .env file from project root or src/main/resources
 * This runs before Spring Boot processes application.properties
 */
public class DotenvLoader implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envFile = findEnvFile();
        
        if (envFile != null && Files.exists(envFile)) {
            Properties properties = new Properties();
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile.toFile()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    // Skip empty lines and comments
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    // Parse KEY=VALUE format
                    int equalsIndex = line.indexOf('=');
                    if (equalsIndex > 0) {
                        String key = line.substring(0, equalsIndex).trim();
                        String value = line.substring(equalsIndex + 1).trim();
                        // Remove quotes if present
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        }
                        properties.setProperty(key, value);
                    }
                }
                // Add as a property source with high priority (before application.properties)
                environment.getPropertySources().addFirst(
                    new PropertiesPropertySource("dotenv", properties)
                );
                System.out.println("✓ Loaded environment variables from: " + envFile.toAbsolutePath());
            } catch (IOException e) {
                System.err.println("Warning: Could not load .env file: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ .env file not found. Using system environment variables only.");
        }
    }
    
    private Path findEnvFile() {
        Path currentDir = Paths.get("").toAbsolutePath();
        
        // List of possible locations to search
        Path[] searchPaths = {
            // 1. Current directory
            currentDir.resolve(".env"),
            // 2. Project root (if running from parent directory)
            currentDir.resolve("42LMS-BACKEND/lms/.env"),
            // 3. If in target/classes, go up to project root
            currentDir.getParent() != null && currentDir.toString().contains("target") 
                ? currentDir.getParent().getParent().resolve(".env") : null,
            // 4. src/main/resources/.env
            currentDir.resolve("src/main/resources/.env"),
            // 5. If in parent, try 42LMS-BACKEND/lms/src/main/resources/.env
            currentDir.resolve("42LMS-BACKEND/lms/src/main/resources/.env"),
            // 6. Try relative to user.dir system property
            Paths.get(System.getProperty("user.dir")).resolve(".env"),
            Paths.get(System.getProperty("user.dir")).resolve("42LMS-BACKEND/lms/.env")
        };
        
        // Search through all possible locations
        for (Path path : searchPaths) {
            if (path != null && Files.exists(path)) {
                return path;
            }
        }
        
        return null;
    }
}


