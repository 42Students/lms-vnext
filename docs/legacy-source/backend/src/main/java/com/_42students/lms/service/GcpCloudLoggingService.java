package com._42students.lms.service;

import com._42students.lms.dto.request.GcpLogDetailRequest;
import com._42students.lms.configuration.DeployMarkerLogger;
import com._42students.lms.dto.request.GcpLogExportRequest;
import com._42students.lms.dto.response.DeployHealthResponse;
import com._42students.lms.dto.response.DeployMarkerResponse;
import com._42students.lms.dto.request.GcpLogQueryRequest;
import com._42students.lms.dto.response.GcpLogEntryResponse;
import com._42students.lms.dto.response.GcpLogSearchResponse;
import com._42students.lms.dto.response.GcpLogSummaryResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@Slf4j
public class GcpCloudLoggingService {
    private static final URI ENTRIES_LIST_URI =
            URI.create("https://logging.googleapis.com/v2/entries:list");

    private static final Map<String, String> ENVIRONMENT_NAMESPACES = Map.of(
            "PRODUCTION", "lms-prod-2026",
            "DEVELOPMENT", "lms-dev-2026",
            "UAT", "rp-uat");

    private static final Map<String, Duration> WINDOWS = Map.of(
            "15M", Duration.ofMinutes(15),
            "1H", Duration.ofHours(1),
            "6H", Duration.ofHours(6),
            "24H", Duration.ofHours(24),
            "7D", Duration.ofDays(7));

    /** Hard ceiling on a single export -- 50/page (GcpCloudLoggingService's own server-side max) x 100. */
    private static final int EXPORT_MAX_PAGES = 100;
    /** Cloud Logging allows up to 1000 per page; a bigger page means far fewer calls against its read quota. */
    private static final int EXPORT_PAGE_SIZE = 500;
    private static final int RATE_LIMIT_RETRIES = 2;
    /** Package-private so tests do not have to wait. */
    long rateLimitBackoffMs = 1500L;
    private static final Duration EXPORT_MAX_RANGE = Duration.ofDays(31);

    // Plain-text (non-JSON) pods are labelled INFO by Kubernetes whatever they print, so the
    // severity clause alone would hide their errors; the textPayload clauses let those entries
    // through the cloud filter and matchesLevel() then applies the real level parsed from the text.
    private static final Map<String, String> LEVEL_FILTERS = Map.of(
            "ERROR", "(severity>=ERROR OR textPayload:\"ERROR\" OR textPayload:\"Exception\")",
            "WARNING", "(severity>=WARNING OR textPayload:\"WARN\" OR textPayload:\"ERROR\" OR textPayload:\"Exception\")",
            "INFO", "severity>=INFO",
            "ALL", "");

    private static final Map<String, Integer> SEVERITY_RANK = Map.of(
            "DEFAULT", 0, "DEBUG", 100, "INFO", 200, "NOTICE", 300, "WARNING", 400,
            "ERROR", 500, "CRITICAL", 600, "ALERT", 700, "EMERGENCY", 800);
    private static final Map<String, Integer> LEVEL_MIN_RANK = Map.of(
            "ERROR", 500, "WARNING", 400, "INFO", 200, "ALL", 0);

    private static final Set<String> SENSITIVE_KEYS = Set.of(
            "authorization", "cookie", "setcookie", "password", "passwd", "pwd",
            "token", "accesstoken", "refreshtoken", "idtoken", "apikey",
            "clientsecret", "secret", "otp", "credential", "credentials",
            "privatekey", "jwt", "sessionid", "csrftoken");

    private static final Pattern JWT_PATTERN = Pattern.compile(
            "\\beyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\b");
    private static final Pattern BEARER_PATTERN = Pattern.compile(
            "(?i)(authorization\\s*[:=]\\s*)(?:bearer\\s+)?[^\\s,;]+");
    private static final Pattern SECRET_ASSIGNMENT_PATTERN = Pattern.compile(
            "(?i)\\b(password|passwd|pwd|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|apikey|client[_-]?secret|secret|otp|cookie|set-cookie)\\b\\s*[:=]\\s*([^\\s,;&]+)");

    private final ObjectMapper objectMapper;
    private final GcpMetadataCredentialProvider credentialProvider;
    private final HttpClient httpClient;

    @Autowired
    public GcpCloudLoggingService(ObjectMapper objectMapper,
                                  GcpMetadataCredentialProvider credentialProvider) {
        this(objectMapper, credentialProvider, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build());
    }

    GcpCloudLoggingService(ObjectMapper objectMapper,
                           GcpMetadataCredentialProvider credentialProvider,
                           HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.credentialProvider = credentialProvider;
        this.httpClient = httpClient;
    }

    public GcpLogSearchResponse search(GcpLogQueryRequest request) {
        if (request == null) request = new GcpLogQueryRequest();
        String env = normalizeAllowed(request.getEnvironment(), ENVIRONMENT_NAMESPACES, "environment", "PRODUCTION");
        String namespace = ENVIRONMENT_NAMESPACES.get(env);
        String timeWindow = normalizeAllowed(request.getWindow(), WINDOWS, "window", "1H");
        String severity = normalizeAllowed(request.getLevel(), LEVEL_FILTERS, "level", "WARNING");
        String normalizedSearch = normalizeSearch(request.getSearch());
        String normalizedPageToken = normalizePageToken(request.getPageToken());
        int pageSize = Math.min(50, Math.max(1, request.getSize() == null ? 50 : request.getSize()));

        Instant current = Instant.now();
        Instant anchor = normalizeAnchor(request.getAnchor(), current);
        Instant since = anchor.minus(WINDOWS.get(timeWindow));
        String filter = buildFilter(namespace, severity, normalizedSearch, since, anchor);

        CloudPage page = queryCloud(filter, pageSize, normalizedPageToken);
        List<GcpLogSummaryResponse> items = new ArrayList<>();
        for (JsonNode entry : page.entries) {
            if (matchesLevel(entry, severity)) items.add(mapSummary(entry));
        }

        return GcpLogSearchResponse.builder()
                .environment(env)
                .namespace(namespace)
                .queriedAt(anchor)
                .items(items)
                .nextPageToken(page.nextPageToken)
                .build();
    }


    private static final int DEPLOY_CLUSTER_GAP_MINUTES = 30;
    private static final int HEALTH_WINDOW_MINUTES = 10;
    private static final int HEALTH_COUNT_CAP_PAGES = 4;

    /** Startup lines (see DeployMarkerLogger) grouped into rollouts, newest first. */
    public List<DeployMarkerResponse> deployMarkers(String environment, int days) {
        String env = normalizeAllowed(environment, ENVIRONMENT_NAMESPACES, "environment", "PRODUCTION");
        String namespace = ENVIRONMENT_NAMESPACES.get(env);
        int boundedDays = Math.min(31, Math.max(1, days));
        Instant until = Instant.now();
        Instant since = until.minus(Duration.ofDays(boundedDays));

        String filter = buildFilter(namespace, "ALL", null, since, until)
                + " AND jsonPayload.message=\"" + DeployMarkerLogger.MESSAGE + "\"";
        List<RawDeployMarker> raw = new ArrayList<>();
        String pageToken = null;
        for (int page = 0; page < 3; page++) {
            CloudPage cloudPage = queryCloud(filter, 50, pageToken);
            for (JsonNode entry : cloudPage.entries) {
                JsonNode payload = entry.path("jsonPayload");
                String timestamp = blankToNull(entry.path("timestamp").asText(null));
                if (timestamp == null) continue;
                raw.add(new RawDeployMarker(Instant.parse(timestamp), text(payload, "commit")));
            }
            pageToken = cloudPage.nextPageToken;
            if (pageToken == null) break;
        }
        return clusterDeployMarkers(raw);
    }

    static final class RawDeployMarker {
        final Instant at;
        final String commit;

        RawDeployMarker(Instant at, String commit) {
            this.at = at;
            this.commit = commit;
        }
    }

    /** Pods of one rollout start within minutes of each other; a different commit is always a new rollout. */
    static List<DeployMarkerResponse> clusterDeployMarkers(List<RawDeployMarker> raw) {
        List<RawDeployMarker> sorted = new ArrayList<>(raw);
        sorted.sort(java.util.Comparator.comparing(m -> m.at));
        List<DeployMarkerResponse> clusters = new ArrayList<>();
        Instant lastInCluster = null;
        for (RawDeployMarker marker : sorted) {
            String commit = marker.commit == null || marker.commit.isBlank() ? "unknown" : marker.commit;
            DeployMarkerResponse current = clusters.isEmpty() ? null : clusters.get(clusters.size() - 1);
            boolean sameRollout = current != null
                    && commit.equals(current.getCommit())
                    && Duration.between(lastInCluster, marker.at).toMinutes() <= DEPLOY_CLUSTER_GAP_MINUTES;
            if (sameRollout) {
                current.setPods(current.getPods() + 1);
            } else {
                clusters.add(DeployMarkerResponse.builder().at(marker.at).commit(commit).pods(1).build());
            }
            lastInCluster = marker.at;
        }
        java.util.Collections.reverse(clusters);
        return clusters;
    }

    /** Counts ERROR entries in the 10 minutes before and after a moment (normally a deploy). */
    public DeployHealthResponse deployHealth(String environment, Instant at) {
        if (at == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "at is required");
        String env = normalizeAllowed(environment, ENVIRONMENT_NAMESPACES, "environment", "PRODUCTION");
        String namespace = ENVIRONMENT_NAMESPACES.get(env);
        Instant now = Instant.now();
        Instant windowEnd = at.plus(Duration.ofMinutes(HEALTH_WINDOW_MINUTES));
        if (windowEnd.isAfter(now)) windowEnd = now;
        boolean[] capped = new boolean[1];
        int before = countErrors(namespace, at.minus(Duration.ofMinutes(HEALTH_WINDOW_MINUTES)), at, capped);
        int after = windowEnd.isAfter(at) ? countErrors(namespace, at, windowEnd, capped) : 0;
        return DeployHealthResponse.builder()
                .at(at)
                .windowMinutes(HEALTH_WINDOW_MINUTES)
                .errorsBefore(before)
                .errorsAfter(after)
                .capped(capped[0])
                .verdict(healthVerdict(before, after))
                .build();
    }

    static String healthVerdict(int before, int after) {
        if (after >= Math.max(5, before * 2)) return "JUMP";
        if (after > before) return "ELEVATED";
        return "OK";
    }

    private int countErrors(String namespace, Instant since, Instant until, boolean[] capped) {
        String filter = buildFilter(namespace, "ERROR", null, since, until);
        int count = 0;
        String pageToken = null;
        for (int page = 0; page < HEALTH_COUNT_CAP_PAGES; page++) {
            CloudPage cloudPage = queryCloud(filter, 50, pageToken);
            for (JsonNode entry : cloudPage.entries) {
                JsonNode safe = entry;
                if (!matchesLevel(safe, "ERROR")) continue;
                String path = safe.path("jsonPayload").path("httpPath").asText("");
                if (path.startsWith("/api/v1/superadmin/logs")) continue;
                count++;
            }
            pageToken = cloudPage.nextPageToken;
            if (pageToken == null) return count;
        }
        capped[0] = true;
        return count;
    }

    public GcpLogEntryResponse detail(GcpLogDetailRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Log detail request is required");
        }

        String env = normalizeAllowed(request.getEnvironment(), ENVIRONMENT_NAMESPACES, "environment", "PRODUCTION");
        String namespace = ENVIRONMENT_NAMESPACES.get(env);
        String insertId = normalizeRequired(request.getInsertId(), "insertId", 512);
        String projectId = resolveProjectId();
        String logName = normalizeLogName(request.getLogName(), projectId);

        String filter = "resource.type=\"k8s_container\""
                + " AND resource.labels.namespace_name=\"" + escapeFilterString(namespace) + "\""
                + " AND resource.labels.container_name=\"lms-be\""
                + " AND logName=\"" + escapeFilterString(logName) + "\""
                + " AND insertId=\"" + escapeFilterString(insertId) + "\"";

        CloudPage page = queryCloud(filter, 1, null);
        if (page.entries.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Log entry was not found");
        }
        return mapDetail(page.entries.get(0), true);
    }

    /**
     * Exports every entry matching the given filters across an explicit [since, until) time range --
     * unlike search(), which only ever looks back a fixed preset duration from "now" for the live
     * view. Paginates through Cloud Logging internally up to EXPORT_MAX_PAGES so the caller (an
     * admin downloading a log file) gets one complete answer in a single call instead of juggling
     * page tokens themselves. Each entry omits the raw payload (kept for the single-entry detail
     * view) to keep a several-thousand-entry export a reasonable file size.
     */
    public ExportResult export(GcpLogExportRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Export request is required");
        }
        String env = normalizeAllowed(request.getEnvironment(), ENVIRONMENT_NAMESPACES, "environment", "PRODUCTION");
        String namespace = ENVIRONMENT_NAMESPACES.get(env);
        String severity = normalizeAllowed(request.getLevel(), LEVEL_FILTERS, "level", "WARNING");
        String normalizedSearch = normalizeSearch(request.getSearch());

        Instant since = request.getSince();
        Instant until = request.getUntil();
        if (since == null || until == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "since and until are both required");
        }
        if (!until.isAfter(since)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "until must be after since");
        }
        if (Duration.between(since, until).compareTo(EXPORT_MAX_RANGE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Range is too wide -- export covers at most " + EXPORT_MAX_RANGE.toDays() + " days at a time");
        }
        Instant now = Instant.now();
        if (since.isAfter(now) || until.isAfter(now.plusSeconds(60))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Range cannot be in the future");
        }

        String filter = buildFilter(namespace, severity, normalizedSearch, since, until, request.isExcludeTooling());

        List<GcpLogEntryResponse> entries = new ArrayList<>();
        String pageToken = null;
        boolean truncated = false;
        for (int page = 0; page < EXPORT_MAX_PAGES; page++) {
            CloudPage cloudPage = queryCloud(filter, EXPORT_PAGE_SIZE, pageToken);
            for (JsonNode entry : cloudPage.entries) {
                if (matchesLevel(entry, severity)) entries.add(mapDetail(entry, false));
            }
            pageToken = cloudPage.nextPageToken;
            if (pageToken == null) break;
            if (page == EXPORT_MAX_PAGES - 1) truncated = true;
        }

        return new ExportResult(entries, truncated, env, since, until);
    }

    public static final class ExportResult {
        public final List<GcpLogEntryResponse> entries;
        public final boolean truncated;
        public final String environment;
        public final Instant since;
        public final Instant until;

        public ExportResult(List<GcpLogEntryResponse> entries, boolean truncated,
                            String environment, Instant since, Instant until) {
            this.entries = entries;
            this.truncated = truncated;
            this.environment = environment;
            this.since = since;
            this.until = until;
        }
    }

    static String buildFilter(String namespace,
                              String level,
                              String search,
                              Instant since,
                              Instant until) {
        return buildFilter(namespace, level, search, since, until, false);
    }

    static String buildFilter(String namespace,
                              String level,
                              String search,
                              Instant since,
                              Instant until,
                              boolean excludeTooling) {
        StringBuilder filter = new StringBuilder();
        filter.append("resource.type=\"k8s_container\"");
        filter.append(" AND resource.labels.namespace_name=\"")
                .append(escapeFilterString(namespace)).append("\"");
        filter.append(" AND resource.labels.container_name=\"lms-be\"");
        filter.append(" AND timestamp>=\"").append(since.truncatedTo(ChronoUnit.MILLIS)).append("\"");
        filter.append(" AND timestamp<=\"").append(until.truncatedTo(ChronoUnit.MILLIS)).append("\"");
        if (excludeTooling) {
            filter.append(" AND NOT jsonPayload.httpPath:\"/api/v1/superadmin/logs\"");
        }

        String severityFilter = LEVEL_FILTERS.get(level);
        if (severityFilter != null && !severityFilter.isBlank()) {
            filter.append(" AND ").append(severityFilter);
        }
        if (search != null && !search.isBlank()) {
            filter.append(" AND SEARCH(\"").append(escapeFilterString(search)).append("\")");
        }
        return filter.toString();
    }

    static String escapeFilterString(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", " ")
                .replace("\n", " ");
    }

    static String sanitizeString(String value) {
        if (value == null) return null;
        String redacted = JWT_PATTERN.matcher(value).replaceAll("[REDACTED_JWT]");
        redacted = BEARER_PATTERN.matcher(redacted).replaceAll("$1[REDACTED]");
        redacted = SECRET_ASSIGNMENT_PATTERN.matcher(redacted).replaceAll("$1=[REDACTED]");
        return limitStatic(redacted, 30000);
    }

    JsonNode sanitizeRaw(JsonNode node) {
        return sanitizeNode(node, null);
    }

    private CloudPage queryCloud(String filter, int pageSize, String pageToken) {
        String projectId = resolveProjectId();
        String accessToken = resolveAccessToken();

        ObjectNode body = objectMapper.createObjectNode();
        body.set("resourceNames", objectMapper.createArrayNode().add("projects/" + projectId));
        body.put("filter", filter);
        body.put("orderBy", "timestamp desc");
        body.put("pageSize", pageSize);
        if (pageToken != null) body.put("pageToken", pageToken);

        HttpRequest request;
        try {
            request = HttpRequest.newBuilder(ENTRIES_LIST_URI)
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not build Cloud Logging request");
        }

        HttpResponse<String> response = send(request);
        // Cloud Logging's read quota is per minute; a short back-off usually clears it.
        for (int attempt = 1; attempt <= RATE_LIMIT_RETRIES && response.statusCode() == 429; attempt++) {
            pauseForRateLimit(attempt);
            response = send(request);
        }
        if (response.statusCode() == 401 || response.statusCode() == 403) {
            log.warn("Cloud Logging read permission denied for backend identity; status={}", response.statusCode());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloud Logging read access is not configured for this backend identity");
        }
        if (response.statusCode() == 429) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Google Cloud Logging rate limit reached. Try again shortly.");
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            log.warn("Cloud Logging query failed; status={}", response.statusCode());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cloud Logging query failed");
        }

        try {
            JsonNode json = objectMapper.readTree(response.body());
            List<JsonNode> entries = new ArrayList<>();
            for (JsonNode entry : json.path("entries")) entries.add(entry);
            String next = blankToNull(json.path("nextPageToken").asText(null));
            return new CloudPage(entries, next);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Cloud Logging returned an unreadable response");
        }
    }

    /** Plain-text parse for entries with no structured payload; null for JSON entries. */
    private PlainTextLogParser.Parsed parsePlainText(JsonNode safeEntry) {
        if (safeEntry.has("jsonPayload") && !safeEntry.path("jsonPayload").isEmpty()) return null;
        String text = blankToNull(safeEntry.path("textPayload").asText(null));
        return text == null ? null : PlainTextLogParser.parse(text);
    }

    private String effectiveSeverity(JsonNode safeEntry) {
        PlainTextLogParser.Parsed parsed = parsePlainText(safeEntry);
        if (parsed != null && parsed.severity != null) return parsed.severity;
        return safeEntry.path("severity").asText("DEFAULT");
    }

    private boolean matchesLevel(JsonNode entry, String level) {
        int min = LEVEL_MIN_RANK.getOrDefault(level, 0);
        if (min == 0) return true;
        String severity = effectiveSeverity(sanitizeRaw(entry));
        return SEVERITY_RANK.getOrDefault(severity, 0) >= min;
    }

    private GcpLogSummaryResponse mapSummary(JsonNode entry) {
        JsonNode safe = sanitizeRaw(entry);
        PlainTextLogParser.Parsed plain = parsePlainText(safe);
        JsonNode payload = safe.path("jsonPayload");
        JsonNode request = safe.path("httpRequest");
        JsonNode resourceLabels = safe.path("resource").path("labels");

        String message = extractMessage(safe, payload);
        String httpMethod = firstNonBlank(text(payload, "httpMethod"), text(request, "requestMethod"));
        String httpStatus = firstNonBlank(text(payload, "httpStatus"), text(request, "status"));
        String durationMs = firstNonBlank(text(payload, "durationMs"), latencyToMs(text(request, "latency")));
        String httpPath = firstNonBlank(text(payload, "httpPath"), safeRequestPath(text(request, "requestUrl")));
        String exception = plain != null ? plain.exception : text(payload, "exception");

        return GcpLogSummaryResponse.builder()
                .insertId(blankToNull(safe.path("insertId").asText(null)))
                .logName(blankToNull(safe.path("logName").asText(null)))
                .timestamp(blankToNull(safe.path("timestamp").asText(null)))
                .severity(effectiveSeverity(safe))
                .message(limit(plain != null ? sanitizeString(plain.message) : message, 1500))
                .logger(plain != null && plain.logger != null ? plain.logger : text(payload, "logger"))
                .requestId(text(payload, "requestId"))
                .httpMethod(httpMethod)
                .httpPath(httpPath)
                .httpStatus(httpStatus)
                .durationMs(durationMs)
                .namespace(text(resourceLabels, "namespace_name"))
                .pod(text(resourceLabels, "pod_name"))
                .container(text(resourceLabels, "container_name"))
                .userId(text(payload, "userId"))
                .userType(text(payload, "userType"))
                .facultyType(text(payload, "facultyType"))
                .collegeId(text(payload, "collegeId"))
                .organizationId(text(payload, "organizationId"))
                .impersonatorId(text(payload, "impersonatorId"))
                .commit(text(payload, "commit"))
                .hasException(exception != null)
                .build();
    }

    private GcpLogEntryResponse mapDetail(JsonNode entry, boolean includeRaw) {
        JsonNode safe = sanitizeRaw(entry);
        PlainTextLogParser.Parsed plain = parsePlainText(safe);
        JsonNode payload = safe.path("jsonPayload");
        JsonNode request = safe.path("httpRequest");
        JsonNode resourceLabels = safe.path("resource").path("labels");

        return GcpLogEntryResponse.builder()
                .insertId(blankToNull(safe.path("insertId").asText(null)))
                .logName(blankToNull(safe.path("logName").asText(null)))
                .timestamp(blankToNull(safe.path("timestamp").asText(null)))
                .severity(effectiveSeverity(safe))
                .message(limit(plain != null ? sanitizeString(plain.message) : extractMessage(safe, payload), 8000))
                .exception(limit(plain != null ? sanitizeString(plain.exception) : text(payload, "exception"), 30000))
                .logger(plain != null && plain.logger != null ? plain.logger : text(payload, "logger"))
                .requestId(text(payload, "requestId"))
                .httpMethod(firstNonBlank(text(payload, "httpMethod"), text(request, "requestMethod")))
                .httpPath(firstNonBlank(text(payload, "httpPath"), safeRequestPath(text(request, "requestUrl"))))
                .httpStatus(firstNonBlank(text(payload, "httpStatus"), text(request, "status")))
                .durationMs(firstNonBlank(text(payload, "durationMs"), latencyToMs(text(request, "latency"))))
                .namespace(text(resourceLabels, "namespace_name"))
                .pod(text(resourceLabels, "pod_name"))
                .container(text(resourceLabels, "container_name"))
                .userId(text(payload, "userId"))
                .userType(text(payload, "userType"))
                .facultyType(text(payload, "facultyType"))
                .collegeId(text(payload, "collegeId"))
                .organizationId(text(payload, "organizationId"))
                .impersonatorId(text(payload, "impersonatorId"))
                .commit(text(payload, "commit"))
                .raw(includeRaw ? safe : null)
                .build();
    }

    private String extractMessage(JsonNode safeEntry, JsonNode payload) {
        String message = text(payload, "message");
        if (message == null) message = blankToNull(safeEntry.path("textPayload").asText(null));
        if (message == null) message = text(safeEntry.path("protoPayload").path("status"), "message");
        return message == null ? "(log entry has no message field)" : sanitizeString(message);
    }

    private JsonNode sanitizeNode(JsonNode node, String fieldName) {
        if (node == null || node.isMissingNode() || node.isNull()) return node;

        String normalizedKey = normalizeKey(fieldName);
        if (normalizedKey != null && SENSITIVE_KEYS.contains(normalizedKey)) {
            return objectMapper.getNodeFactory().textNode("[REDACTED]");
        }

        if (node.isObject()) {
            ObjectNode output = objectMapper.createObjectNode();
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                output.set(field.getKey(), sanitizeNode(field.getValue(), field.getKey()));
            }
            return output;
        }

        if (node.isArray()) {
            ArrayNode output = objectMapper.createArrayNode();
            for (JsonNode child : node) output.add(sanitizeNode(child, fieldName));
            return output;
        }

        if (node.isTextual()) {
            String value = node.asText();
            if ("requesturl".equals(normalizedKey) || "referer".equals(normalizedKey)) {
                value = stripUrlQuery(value);
            }
            return objectMapper.getNodeFactory().textNode(sanitizeString(value));
        }

        return node.deepCopy();
    }

    private String normalizeKey(String fieldName) {
        if (fieldName == null) return null;
        return fieldName.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private String stripUrlQuery(String value) {
        if (value == null) return null;
        try {
            URI uri = URI.create(value);
            if (uri.getScheme() != null) {
                return uri.getScheme() + "://" + uri.getAuthority() + (uri.getPath() == null ? "" : uri.getPath());
            }
        } catch (Exception ignored) {}
        int q = value.indexOf('?');
        int h = value.indexOf('#');
        int end = value.length();
        if (q >= 0) end = Math.min(end, q);
        if (h >= 0) end = Math.min(end, h);
        return value.substring(0, end);
    }

    private String safeRequestPath(String requestUrl) {
        String stripped = stripUrlQuery(requestUrl);
        if (stripped == null) return null;
        try {
            URI uri = URI.create(stripped);
            return limit(uri.getPath(), 1000);
        } catch (Exception ignored) {
            return limit(stripped, 1000);
        }
    }

    private String latencyToMs(String latency) {
        if (latency == null || latency.isBlank()) return null;
        try {
            String normalized = latency.trim().toLowerCase(Locale.ROOT);
            if (normalized.endsWith("s")) {
                BigDecimal seconds = new BigDecimal(normalized.substring(0, normalized.length() - 1));
                return seconds.multiply(BigDecimal.valueOf(1000)).stripTrailingZeros().toPlainString();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String resolveProjectId() {
        try {
            return credentialProvider.getProjectId();
        } catch (CloudLoggingUnavailableException e) {
            log.warn("Cloud Logging project identity unavailable: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloud Logging is not available to this backend identity");
        }
    }

    private String resolveAccessToken() {
        try {
            return credentialProvider.getAccessToken();
        } catch (CloudLoggingUnavailableException e) {
            log.warn("Cloud Logging credentials unavailable: {}", e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloud Logging is not available to this backend identity");
        }
    }

    private String normalizeAllowed(String value,
                                    Map<String, ?> allowed,
                                    String field,
                                    String fallback) {
        String normalized = value == null || value.isBlank()
                ? fallback
                : value.trim().toUpperCase(Locale.ROOT);
        if (!allowed.containsKey(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
        return normalized;
    }

    private String normalizeSearch(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isEmpty()) return null;
        if (normalized.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search is too long");
        }
        return normalized;
    }

    private Instant normalizeAnchor(Instant anchor, Instant current) {
        if (anchor == null) return current;
        if (anchor.isAfter(current.plusSeconds(60)) || anchor.isBefore(current.minus(Duration.ofDays(8)))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination anchor");
        }
        return anchor;
    }

    private String normalizePageToken(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isEmpty()) return null;
        if (normalized.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page token");
        }
        return normalized;
    }

    private String normalizeRequired(String value, String field, int max) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        String normalized = value.trim();
        if (normalized.length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
        return normalized;
    }

    private String normalizeLogName(String value, String projectId) {
        String logName = normalizeRequired(value, "logName", 1200);
        String prefix = "projects/" + projectId + "/logs/";
        if (!logName.startsWith(prefix)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid logName");
        }
        return logName;
    }

    private void pauseForRateLimit(int attempt) {
        if (rateLimitBackoffMs <= 0) return;
        try {
            Thread.sleep(rateLimitBackoffMs * attempt);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private HttpResponse<String> send(HttpRequest request) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Cloud Logging is temporarily unreachable");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloud Logging request was interrupted");
        }
    }

    private String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        if (value.isTextual() || value.isNumber() || value.isBoolean()) {
            return blankToNull(sanitizeString(value.asText()));
        }
        return blankToNull(sanitizeString(value.toString()));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String limit(String value, int max) {
        return limitStatic(value, max);
    }

    private static String limitStatic(String value, int max) {
        if (value == null || value.length() <= max) return value;
        return value.substring(0, max) + "…";
    }

    private static final class CloudPage {
        private final List<JsonNode> entries;
        private final String nextPageToken;

        private CloudPage(List<JsonNode> entries, String nextPageToken) {
            this.entries = entries;
            this.nextPageToken = nextPageToken;
        }
    }
}
