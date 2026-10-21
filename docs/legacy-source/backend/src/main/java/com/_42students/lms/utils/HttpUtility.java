package com._42students.lms.utils;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.channels.Channels;
import java.nio.channels.Pipe;
import java.nio.charset.StandardCharsets;

import org.apache.http.HttpEntity;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.springframework.stereotype.Component;

@Component
public class HttpUtility {
    public HttpResponse<String> httpPostMultipartWithFile(String requestUrl, File file, String apiKey) throws Exception {
         /**
        * Create a Multipart request body with MultipartEntityBuilder.
        */
        HttpEntity httpEntity = MultipartEntityBuilder.create()
                // FILE
                .addBinaryBody("file", file, ContentType.IMAGE_JPEG,
                        "originalImage.jpg")
                .build();

        /**
        * Use pipeline streams to write the encoded data directly to the network
        * instead of caching it in memory. Because Multipart request bodies contain
        * files, they can cause memory overflows if cached in memory.
        */
        Pipe pipe = Pipe.open();

        // Pipeline streams must be used in a multi-threaded environment. Using one
        // thread for simultaneous reads and writes can recruiter lead to deadlocks.
        new Thread(() -> {
            try (OutputStream outputStream = Channels.newOutputStream(pipe.sink())) {
                // Write the encoded data to the pipeline.
                httpEntity.writeTo(outputStream);
            } catch (IOException e) {
                e.printStackTrace();
            }

        }).start();

        HttpClient httpClient = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder(new URI(requestUrl))
                // The Content-Type header is important, don't forget to set it.
                .header("Content-Type", ContentType.MULTIPART_FORM_DATA.getMimeType())
                // The x-api-key header is important, don't forget to set it.
                .header("x-api-key", apiKey)
                // Reads data from a pipeline stream.
                .POST(BodyPublishers.ofInputStream(() -> Channels.newInputStream(pipe.source()))).build();

        HttpResponse<String> responseBody = httpClient.send(request, BodyHandlers.ofString(StandardCharsets.UTF_8));

        return responseBody;
    }
}

