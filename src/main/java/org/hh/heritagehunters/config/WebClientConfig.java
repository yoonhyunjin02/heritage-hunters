package org.hh.heritagehunters.config;

import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {

  @Bean
  public WebClient aiWebClient(WebClient.Builder builder) {

    HttpClient httpClient = HttpClient.create()
        .responseTimeout(Duration.ofSeconds(60))
        .doOnConnected(conn ->
            conn.addHandlerLast(new ReadTimeoutHandler(60))
                .addHandlerLast(new WriteTimeoutHandler(60))
        );

    return builder
        .baseUrl("https://kdt-api-function.azurewebsites.net")
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .build();
  }
}
