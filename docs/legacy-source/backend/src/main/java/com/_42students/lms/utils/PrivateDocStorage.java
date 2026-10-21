package com._42students.lms.utils;

import com.amazonaws.HttpMethod;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.ResponseHeaderOverrides;
import com.amazonaws.services.s3.model.S3Object;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Date;

/**
 * The private R2 bucket for identity documents (Aadhaar, PAN) and marksheets. The main bucket is public (anyone with a link can open
 * a file), so these never go there. Nothing in this bucket is reachable without a link the backend signs after its access check
 * (FileUploadController#enforceKeyAccess), and those links expire in minutes.
 *
 * Stored on profiles as {@code private-doc:<key>} (see {@link #REF_PREFIX}), never as a URL.
 *
 * Settings (environment): R2_PRIVATE_BUCKET_NAME, R2_PRIVATE_ACCESS_KEY / R2_PRIVATE_SECRET_KEY (optional; the main R2 keys are used
 * when blank, which then need access to this bucket too).
 *
 * INTERIM: until the dedicated private bucket exists, the bucket name defaults to the main (public) bucket (application.properties).
 * The documents still never get a public URL in the app and are opened only through signed links, but a direct link to the file would
 * work in that bucket. Setting R2_PRIVATE_BUCKET_NAME and running scripts/migrate_private_docs.py finishes the move.
 */
@Component
public class PrivateDocStorage {

    public static final String REF_PREFIX = "private-doc:";
    /** How long a signed link to open one document lives. */
    public static final int VIEW_MINUTES = 5;

    @Value("${r2.account.id:}")
    private String accountId;
    @Value("${r2.private.bucket.name:}")
    private String bucket;
    @Value("${r2.private.access.key:}")
    private String privateAccessKey;
    @Value("${r2.private.secret.key:}")
    private String privateSecretKey;
    @Value("${r2.access.key:}")
    private String accessKey;
    @Value("${r2.secret.key:}")
    private String secretKey;

    private volatile AmazonS3 client;

    public boolean isConfigured() {
        return notBlank(accountId) && notBlank(bucket) && (notBlank(privateAccessKey) || notBlank(accessKey));
    }

    public static boolean isRef(String value) {
        return value != null && value.trim().startsWith(REF_PREFIX);
    }

    public static String keyOf(String ref) {
        String k = ref.trim().substring(REF_PREFIX.length());
        while (k.startsWith("/")) k = k.substring(1);
        return k;
    }

    public static String refOf(String key) {
        return REF_PREFIX + key;
    }

    private AmazonS3 s3() {
        if (!isConfigured()) throw new IllegalStateException("Private document storage is not set up");
        AmazonS3 c = client;
        if (c == null) {
            synchronized (this) {
                if (client == null) {
                    String ak = notBlank(privateAccessKey) ? privateAccessKey : accessKey;
                    String sk = notBlank(privateAccessKey) ? privateSecretKey : secretKey;
                    client = AmazonS3ClientBuilder.standard()
                            .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(ak, sk)))
                            .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration("https://" + accountId + ".r2.cloudflarestorage.com", "auto"))
                            .withPathStyleAccessEnabled(true)
                            .build();
                }
                c = client;
            }
        }
        return c;
    }

    /** A signed PUT for the browser to upload straight to the private bucket (it must send the same Content-Type). */
    public String presignedPut(String key, String contentType, int minutes) {
        GeneratePresignedUrlRequest r = new GeneratePresignedUrlRequest(bucket, key).withMethod(HttpMethod.PUT)
                .withExpiration(new Date(System.currentTimeMillis() + minutes * 60_000L))
                .withContentType(contentType != null ? contentType : "application/octet-stream");
        return s3().generatePresignedUrl(r).toString();
    }

    /** A short-lived link to open one document. Inline for PDFs and images so it opens in the browser, never cached. */
    public String presignedGet(String key) {
        ResponseHeaderOverrides headers = new ResponseHeaderOverrides().withCacheControl("no-store");
        GeneratePresignedUrlRequest r = new GeneratePresignedUrlRequest(bucket, key).withMethod(HttpMethod.GET)
                .withExpiration(new Date(System.currentTimeMillis() + VIEW_MINUTES * 60_000L))
                .withResponseHeaders(headers);
        return s3().generatePresignedUrl(r).toString();
    }

    public void upload(String key, InputStream in, long length, String contentType) {
        ObjectMetadata m = new ObjectMetadata();
        m.setContentLength(length);
        m.setContentType(contentType != null ? contentType : "application/octet-stream");
        s3().putObject(bucket, key, in, m);
    }

    public boolean exists(String key) {
        try {
            return s3().doesObjectExist(bucket, key);
        } catch (RuntimeException e) {
            return false;
        }
    }

    public S3Object download(String key) {
        return s3().getObject(bucket, key);
    }

    public void delete(String key) {
        s3().deleteObject(bucket, key);
    }

    public String bucketName() {
        return bucket;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }
}
