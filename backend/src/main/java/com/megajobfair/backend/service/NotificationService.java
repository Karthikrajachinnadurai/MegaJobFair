package com.megajobfair.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final boolean enabled;
    private final String loginUrl;
    private final String apiKey;
    private final RestClient restClient;


    public NotificationService(@Value("${app.notify.enabled}") boolean enabled,
                               @Value("${app.notify.base-url}") String baseUrl,
                               @Value("${app.notify.api-key:}") String apiKey,
                               @Value("${app.frontend.login-url}") String loginUrl) {
        this.enabled = enabled;
        this.loginUrl = loginUrl;
        this.apiKey = apiKey;

        if (enabled && (apiKey == null || apiKey.isBlank())) {
            log.warn("NOTIFY_ENABLED=true but NOTIFY_API_KEY is empty: the Python service will reject every email with 401");
        }

        // Without timeouts, a stuck Python service would freeze the gate volunteer's scan
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    record CredentialsPayload(String email, String name, String password, String loginUrl) {
    }

    /** @return true if the Python service accepted the email (it sends it in the background). */
    public boolean sendCredentials(String email, String name, String password) {
        if (!enabled) {
            log.warn("[NOTIFY DISABLED] Login for {} ({}): password = {}, link = {}", name, email, password, loginUrl);
            return false;
        }
        try {
            restClient.post()
                    .uri("/notify/credentials")
                    .header("X-API-Key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new CredentialsPayload(email, name, password, loginUrl))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Credentials email queued for {}", email);
            return true;
        } catch (RestClientException e) {
            log.error("Could not send credentials email to {}: {}", email, e.getMessage());
            return false;
        }
    }
}