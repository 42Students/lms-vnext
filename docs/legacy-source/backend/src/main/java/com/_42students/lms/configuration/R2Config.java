package com._42students.lms.configuration;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com._42students.lms.config.R2Condition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;

/**
 * Cloudflare R2 Configuration
 * 
 * R2 is S3-compatible, so we use the AWS S3 SDK with a custom endpoint.
 * 
 * Configure the following in application.properties:
 *   r2.account.id=your_cloudflare_account_id
 *   r2.access.key=your_r2_access_key_id
 *   r2.secret.key=your_r2_secret_access_key
 *   r2.bucket.name=your_bucket_name
 *   r2.public.url=https://your-custom-domain.com or https://pub-xxx.r2.dev
 * 
 * This configuration is only active when r2.account.id is provided and non-empty.
 * This allows tests to run without R2 configuration.
 */
@Configuration
@Conditional(R2Condition.class)
public class R2Config {

    @Value("${r2.account.id:}")
    private String accountId;

    @Value("${r2.access.key:}")
    private String accessKey;

    @Value("${r2.secret.key:}")
    private String secretKey;

    @Value("${r2.bucket.name:}")
    private String bucketName;

    /**
     * Creates an S3-compatible client configured for Cloudflare R2.
     * The bean is named "r2Client" but typed as AmazonS3 for SDK compatibility.
     */
    @Bean
    public AmazonS3 r2Client() {
        // Validate that accountId is not empty (should be caught by conditional, but double-check)
        if (accountId == null || accountId.trim().isEmpty()) {
            throw new IllegalStateException("R2 account ID is required but not configured");
        }
        
        // R2 endpoint format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
        String r2Endpoint = "https://" + accountId + ".r2.cloudflarestorage.com";
        
        AWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
        
        return AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(credentials))
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(
                        r2Endpoint, 
                        "auto"  // R2 uses "auto" as the region
                ))
                .withPathStyleAccessEnabled(true)  // Required for R2
                .build();
    }
    
    public String getBucketName() {
        return bucketName;
    }
}

