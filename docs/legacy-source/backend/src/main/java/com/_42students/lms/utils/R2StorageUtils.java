package com._42students.lms.utils;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.util.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URL;
import java.util.Calendar;
import java.util.Locale;
import java.util.UUID;

/**
 * Utility class for Cloudflare R2 storage operations.
 * Provides methods for uploading, downloading, and managing files in R2.
 */
import com._42students.lms.config.R2Condition;
import org.springframework.context.annotation.Conditional;

@Component
@Conditional(R2Condition.class)
public class R2StorageUtils {

    @Autowired
    private AmazonS3 r2Client;

    @Value("${r2.bucket.name:}")
    private String bucketName;
    
    @Value("${r2.public.url:}")
    private String publicUrl;

    @Value("${r2.playback.expiry-minutes:120}")
    private int playbackExpiryMinutes;

    /**
     * Upload a file to R2 storage.
     * 
     * @param key The object key (path/filename in R2)
     * @param inputStream The file content as InputStream
     * @throws IOException If upload fails
     */
    public void uploadFile(String key, InputStream inputStream) throws IOException {
        ObjectMetadata metadata = new ObjectMetadata();
        byte[] bytes = IOUtils.toByteArray(inputStream);
        metadata.setContentLength(bytes.length);
        
        String mimeType = inferSafeContentTypeFromKey(key);
        metadata.setContentType(mimeType);
        metadata.setContentDisposition(isInlineSafe(mimeType) ? "inline" : "attachment");
        
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);
        r2Client.putObject(bucketName, key, byteArrayInputStream, metadata);
    }

    private static boolean isInlineSafe(String contentType) {
        if (contentType == null) return false;
        String ct = contentType.toLowerCase(Locale.ROOT);
        return ct.startsWith("image/") || ct.startsWith("video/");
    }

    private static String inferSafeContentTypeFromKey(String key) {
        if (key == null) return "application/octet-stream";
        String normalized = key.toLowerCase(Locale.ROOT);
        int dot = normalized.lastIndexOf('.');
        if (dot < 0 || dot == normalized.length() - 1) return "application/octet-stream";
        String ext = normalized.substring(dot + 1);
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "mov" -> "video/quicktime";
            case "ppt" -> "application/vnd.ms-powerpoint";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }

    /**
     * Upload a MultipartFile to R2 with a unique filename.
     * 
     * @param file The MultipartFile to upload
     * @param folder Optional folder path (e.g., "images/profiles")
     * @return The public URL of the uploaded file
     * @throws IOException If upload fails
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Generate unique filename
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        String key = (folder != null && !folder.isEmpty()) 
                ? folder + "/" + uniqueFilename 
                : uniqueFilename;
        
        // Upload
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        String safeContentType = inferSafeContentTypeFromKey(uniqueFilename);
        metadata.setContentType(safeContentType);
        metadata.setContentDisposition(isInlineSafe(safeContentType) ? "inline" : "attachment");
        
        r2Client.putObject(bucketName, key, file.getInputStream(), metadata);
        
        return getPublicUrl(key);
    }

    /**
     * Download a file from R2 storage.
     * 
     * @param key The object key
     * @return S3Object containing the file content
     * @throws IOException If download fails
     */
    public S3Object downloadFile(String key) throws IOException {
        return r2Client.getObject(bucketName, key);
    }

    /**
     * Get a file from a specific bucket.
     * 
     * @param bucket The bucket name
     * @param key The object key
     * @return S3Object containing the file content
     */
    public S3Object getFile(String bucket, String key) {
        try {
            return r2Client.getObject(bucket, key);
        } catch (AmazonServiceException ase) {
            throw ase;
        } catch (AmazonClientException ace) {
            throw ace;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Delete a file from R2 storage.
     * 
     * @param key The object key to delete
     */
    public void deleteFile(String key) {
        r2Client.deleteObject(bucketName, key);
    }

    /**
     * Check if a file exists in R2.
     *
     * @param key The object key
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String key) {
        return r2Client.doesObjectExist(bucketName, key);
    }

    /**
     * Server-side copy of an object to a new key within the same bucket. Used to rehost a file
     * that was referenced by-key from another owner (e.g. a template's virtual resource row) into
     * an independently-owned key, so the two copies' lifecycles (edit/delete) no longer collide.
     *
     * @param sourceKey      The existing object key to copy from
     * @param destinationKey The new object key to copy to
     */
    public void copyFile(String sourceKey, String destinationKey) {
        r2Client.copyObject(bucketName, sourceKey, bucketName, destinationKey);
    }

    /**
     * HEAD an object to get its actual stored metadata (size, content type) — a presigned PUT
     * URL only binds Content-Type, not Content-Length, so a client's declared size at presign
     * time can't be trusted; this is what actually landed in the bucket.
     *
     * @param key The object key
     * @return ObjectMetadata for the stored object
     */
    public ObjectMetadata getObjectMetadata(String key) {
        return r2Client.getObjectMetadata(bucketName, key);
    }

    /**
     * Generate a presigned URL for temporary access (GET).
     * Valid for 1 hour.
     *
     * @param key The object key
     * @return Presigned URL string
     */
    public String generatePresignedUrl(String key) {
        try {
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.HOUR, 1);
            final URL presignedUrl = r2Client.generatePresignedUrl(bucketName, key, cal.getTime());
            return presignedUrl.toString();
        } catch (AmazonClientException e) {
            throw e;
        }
    }

    /**
     * Generate a presigned GET URL with configurable expiry (for video playback).
     * Used by playback-url endpoints so URLs are short-lived.
     *
     * @param key           The object key
     * @param expiryMinutes Expiry in minutes (e.g. from r2.playback.expiry-minutes)
     * @return Presigned GET URL string
     */
    public String generatePresignedGetUrl(String key, int expiryMinutes) {
        try {
            java.util.Date expiration = new java.util.Date(System.currentTimeMillis() + expiryMinutes * 60L * 1000L);
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucketName, key)
                    .withMethod(HttpMethod.GET)
                    .withExpiration(expiration);
            URL presignedUrl = r2Client.generatePresignedUrl(request);
            return presignedUrl.toString();
        } catch (AmazonClientException e) {
            throw e;
        }
    }

    /**
     * Get the configured playback expiry in minutes (for use by playback services).
     */
    public int getPlaybackExpiryMinutes() {
        return playbackExpiryMinutes;
    }

    /**
     * Generate a presigned PUT URL for direct browser upload to R2.
     * The frontend must send the same Content-Type header when PUTting the file.
     *
     * @param key           The object key (e.g. folder/uuid.ext)
     * @param contentType   Content-Type to sign; client must send this exact header
     * @param expiryMinutes Expiry in minutes (e.g. 10–15)
     * @return Presigned PUT URL string
     */
    public String generatePresignedPutUrl(String key, String contentType, int expiryMinutes) {
        try {
            java.util.Date expiration = new java.util.Date(System.currentTimeMillis() + expiryMinutes * 60L * 1000L);
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucketName, key)
                    .withMethod(HttpMethod.PUT)
                    .withExpiration(expiration)
                    .withContentType(contentType != null ? contentType : "application/octet-stream");
            URL presignedUrl = r2Client.generatePresignedUrl(request);
            return presignedUrl.toString();
        } catch (AmazonClientException e) {
            throw e;
        }
    }

    /**
     * Get the public URL for a file.
     * Uses the configured public URL if available, otherwise generates a presigned URL.
     * 
     * @param key The object key
     * @return Public URL string
     */
    public String getPublicUrl(String key) {
        if (publicUrl != null && !publicUrl.isEmpty()) {
            String url = publicUrl.endsWith("/") ? publicUrl : publicUrl + "/";
            return url + key;
        }
        return generatePresignedUrl(key);
    }

    /**
     * Get the configured bucket name.
     *
     * @return Bucket name
     */
    public String getBucketName() {
        return bucketName;
    }

    /**
     * Get the configured public URL base (r2.public.url), or null if unset. Callers that need to
     * tell whether some URL string actually points into this bucket (vs. a genuinely external
     * link) use this rather than duplicating the property lookup.
     */
    public String getPublicUrlBase() {
        return publicUrl != null && !publicUrl.isEmpty() ? (publicUrl.endsWith("/") ? publicUrl : publicUrl + "/") : null;
    }

    /**
     * Convert MultipartFile to File.
     * 
     * @param file MultipartFile to convert
     * @return File object
     * @throws IOException If conversion fails
     */
    public File convertMultiPartToFile(MultipartFile file) throws IOException {
        File convFile = new File(file.getOriginalFilename());
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
    }
}

