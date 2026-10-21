package com._42students.lms.service.impl;

import com._42students.lms.service.NotificationTemplateContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ExotelSmsServiceImplTest {
    private RestTemplate client;
    private ExotelSmsServiceImpl service;

    @BeforeEach
    void setUp() {
        client = mock(RestTemplate.class);
        service = new ExotelSmsServiceImpl(client, new ObjectMapper());
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        ReflectionTestUtils.setField(service, "apiToken", "test-token");
        ReflectionTestUtils.setField(service, "accountSid", "42students1");
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://api.exotel.com");
        ReflectionTestUtils.setField(service, "dltEntityId", "1001650442971323333");
        ReflectionTestUtils.setField(service, "otpSenderId", "FLERNR");
        ReflectionTestUtils.setField(service, "otpDltTemplateId", "1707176554481180936");
        ReflectionTestUtils.setField(service, "otpSmsType", "transactional_opt_in");
        ReflectionTestUtils.setField(service, "jobSenderId", "FLERNR");
        ReflectionTestUtils.setField(service, "jobDltTemplateId", "");
        ReflectionTestUtils.setField(service, "notificationSenderId", "FLERNR");
        ReflectionTestUtils.setField(service, "notificationDltTemplateId", "");
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void otpUsesExotelPostBasicAuthAndApprovedDltTemplate() {
        when(client.exchange(any(URI.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"SMSMessage\":{\"Sid\":\"sms-123\",\"Status\":\"queued\"}}"));
        assertTrue(service.sendOtp("9876543210", "123456", NotificationTemplateContext.LMS));
        ArgumentCaptor<URI> url = ArgumentCaptor.forClass(URI.class);
        ArgumentCaptor<HttpEntity> request = ArgumentCaptor.forClass(HttpEntity.class);
        verify(client).exchange(url.capture(), eq(HttpMethod.POST), request.capture(), eq(String.class));
        // Must end in ".json": without it Exotel replies in XML whatever the Accept header says, and the
        // JSON parse of a successfully sent SMS fails, surfacing as a 503 on every login.
        assertEquals("https://api.exotel.com/v1/Accounts/42students1/Sms/send.json", url.getValue().toString());
        assertTrue(request.getValue().getHeaders().getFirst("Authorization").startsWith("Basic "));
        org.springframework.util.MultiValueMap<String, String> form =
                (org.springframework.util.MultiValueMap<String, String>) request.getValue().getBody();
        assertEquals("FLERNR", form.getFirst("From"));
        assertEquals("+919876543210", form.getFirst("To"));
        assertEquals("1001650442971323333", form.getFirst("DltEntityId"));
        assertEquals("1707176554481180936", form.getFirst("DltTemplateId"));
        assertEquals("transactional_opt_in", form.getFirst("SmsType"));
        assertEquals("high", form.getFirst("Priority"));
        assertEquals("123456 is the One Time Password (OTP) to access your account at 42LMS.COM. For security reasons, please do not share this OTP with anyone. -JRSPF.", form.getFirst("Body"));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void aNonJsonProviderReplyIsNotTreatedAsAnAcceptedOtp() {
        // The shape Exotel really returns when the endpoint is called without ".json".
        when(client.exchange(any(URI.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("<?xml version=\"1.0\" encoding=\"UTF-8\"?><TwilioResponse><SMSMessage>"
                        + "<Sid>sms-123</Sid><Status>queued</Status></SMSMessage></TwilioResponse>"));
        assertFalse(service.sendOtp("9876543210", "123456", NotificationTemplateContext.LMS));
    }

    @Test
    void missingJobMappingDoesNotSendWrongTemplate() {
        assertFalse(service.sendJobUpdateSms("9876543210", "Student"));
        verifyNoInteractions(client);
    }

    @Test
    void missingNotificationMappingDoesNotSendWrongTemplate() {
        assertFalse(service.sendNotification("9876543210", "Absent today"));
        verifyNoInteractions(client);
    }

    @Test
    void missingCredentialsCannotSend() {
        ReflectionTestUtils.setField(service, "apiToken", "");
        assertFalse(service.sendOtp("9876543210", "123456"));
        verifyNoInteractions(client);
    }

    @Test
    void unsuccessfulResponseDoesNotClaimSuccess() {
        when(client.exchange(any(URI.class), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"SMSMessage\":{\"Sid\":\"sms-123\",\"Status\":\"failed\"}}"));
        assertFalse(service.sendOtp("9876543210", "123456"));
    }

    @Test
    void invalidRecipientDoesNotSend() {
        assertFalse(service.sendOtp("not-a-phone", "123456"));
        verifyNoInteractions(client);
    }
}
