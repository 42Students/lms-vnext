package com._42students.lms.auditfindings;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;

/**
 * Reads 42Students/lms-findings over GitHub's REST API (and, later, writes STATUS.md there). Read-only use today.
 *
 * Credentials, from deployment configuration (never source):
 *  - a GitHub App installed on that repo only (app.audit-findings.github.app-id / installation-id / private-key, PKCS#8 PEM):
 *    the deployed backends use this; its tokens last an hour and reach no other repo;
 *  - or a token (app.audit-findings.github.token): for a local backend.
 * With neither, sync is off and the page says so.
 */
@Component
public class GitHubFindingsClient {

    private static final String API = "https://api.github.com";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper json = new ObjectMapper();

    @Value("${app.audit-findings.repo:42Students/lms-findings}")
    private String repo;
    @Value("${app.audit-findings.branch:main}")
    private String branch;
    @Value("${app.audit-findings.github.token:}")
    private String token;
    @Value("${app.audit-findings.github.app-id:}")
    private String appId;
    @Value("${app.audit-findings.github.installation-id:}")
    private String installationId;
    @Value("${app.audit-findings.github.private-key:}")
    private String privateKeyPem;

    private String installationToken;
    private Instant installationTokenExpiry = Instant.EPOCH;

    public record InboxFile(String path, String blobSha) {}

    public boolean isConfigured() {
        return !token.isBlank() || (!appId.isBlank() && !installationId.isBlank() && !privateKeyPem.isBlank());
    }

    public String repo() { return repo; }

    /** The newest commit on the findings branch. */
    public String headCommit() throws Exception {
        return get("/repos/" + repo + "/commits/" + branch).path("sha").asText();
    }

    /** Every file under inbox/ at that commit, with its blob hash. */
    public List<InboxFile> inboxFiles(String commit) throws Exception {
        JsonNode tree = get("/repos/" + repo + "/git/trees/" + commit + "?recursive=1");
        if (tree.path("truncated").asBoolean(false)) throw new IllegalStateException("The findings repo's file list is too large to read in one go");
        List<InboxFile> out = new ArrayList<>();
        for (JsonNode n : tree.path("tree")) {
            String path = n.path("path").asText();
            if ("blob".equals(n.path("type").asText()) && path.startsWith("inbox/") && !path.equals("inbox/.gitkeep")) {
                out.add(new InboxFile(path, n.path("sha").asText()));
            }
        }
        return out;
    }

    /** One file's content (UTF-8) and its size in bytes. */
    public byte[] blob(String blobSha) throws Exception {
        JsonNode b = get("/repos/" + repo + "/git/blobs/" + blobSha);
        if (!"base64".equals(b.path("encoding").asText())) throw new IllegalStateException("Unexpected blob encoding");
        return Base64.getMimeDecoder().decode(b.path("content").asText());
    }

    private JsonNode get(String path) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(API + path))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/vnd.github+json")
                .header("X-GitHub-Api-Version", "2022-11-28")
                .header("Authorization", "Bearer " + accessToken())
                .GET().build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() != 200) {
            throw new IllegalStateException("GitHub answered " + res.statusCode() + " for " + path.replaceAll("\\?.*", ""));
        }
        return json.readTree(res.body());
    }

    private synchronized String accessToken() throws Exception {
        if (!token.isBlank()) return token.trim();
        if (installationToken != null && Instant.now().isBefore(installationTokenExpiry.minusSeconds(120))) return installationToken;
        // GitHub App: a 9-minute JWT signed with the app's key buys a 1-hour installation token for the findings repo.
        Instant now = Instant.now();
        String jwt = Jwts.builder()
                .setIssuer(appId.trim())
                .setIssuedAt(Date.from(now.minusSeconds(60)))
                .setExpiration(Date.from(now.plusSeconds(540)))
                .signWith(privateKey(), SignatureAlgorithm.RS256)
                .compact();
        HttpRequest req = HttpRequest.newBuilder(URI.create(API + "/app/installations/" + installationId.trim() + "/access_tokens"))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/vnd.github+json")
                .header("Authorization", "Bearer " + jwt)
                .POST(HttpRequest.BodyPublishers.noBody()).build();
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() != 201) throw new IllegalStateException("GitHub refused the app token (" + res.statusCode() + ")");
        JsonNode body = json.readTree(res.body());
        installationToken = body.path("token").asText();
        installationTokenExpiry = Instant.parse(body.path("expires_at").asText());
        return installationToken;
    }

    private PrivateKey privateKey() throws Exception {
        String pem = privateKeyPem.replace("\\n", "\n");
        if (pem.contains("BEGIN RSA PRIVATE KEY")) {
            throw new IllegalStateException("Convert the app key to PKCS#8: openssl pkcs8 -topk8 -nocrypt -in app.pem -out app-pkcs8.pem");
        }
        String body = pem.replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(body)));
    }
}
