package org.hh.heritagehunters.domain.search.service;

import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.config.AiClientProperties;
import org.hh.heritagehunters.domain.search.dto.AiAskRequest;
import org.hh.heritagehunters.domain.search.dto.AiQuestionResponse;
import org.hh.heritagehunters.domain.search.dto.AiResetRequest;
import org.hh.heritagehunters.domain.search.dto.AiType;
import org.hh.heritagehunters.domain.search.util.PromptBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j  // logger
@Service
@RequiredArgsConstructor
public class AiProxyService {

  private final WebClient aiWebClient;
  private final AiClientProperties aiClientProperties;
  private final PromptBuilder promptBuilder;

  public AiQuestionResponse ask(Long heritageId, AiAskRequest req) {
    String prompt = promptBuilder.build(
        AiType.from(req.getType()),
        nvl(req.getName()),
        nvl(req.getAddress()),
        nvl(req.getContent())
    );

    String clientId = getClientId(req.getCode());

    long start = System.currentTimeMillis(); // 요청 시각 측정
    AiQuestionResponse response = performAskRequest(prompt, clientId);
    logWithElapsed("AI 요청", req.getCode(), start,
        String.format("\nprompt: %s\nresponse: %s", prompt, response.getContent()));
    return response;
  }

  public void resetState(Long heritageId, AiResetRequest req) {
    String clientId = getClientId(req.getCode());

    long start = System.currentTimeMillis(); // 요청 시각 측정

    aiWebClient
        .method(HttpMethod.DELETE)
        .uri("/api/v1/reset-state")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(Map.of("client_id", clientId))
        .retrieve()
        .toBodilessEntity()
        .block(Duration.ofSeconds(10)); // 적절한 타임아웃

    logWithElapsed("AI 리셋", req.getCode(), start, "AI 리셋 완료");
  }

  private AiQuestionResponse performAskRequest(String prompt, String clientId) {
    return aiWebClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/api/v1/question")
            .queryParam("content", prompt)
            .queryParam("client_id", clientId)
            .build())
        .retrieve()
        .onStatus(HttpStatusCode::isError, res ->
            res.bodyToMono(String.class)
                .defaultIfEmpty("AI upstream error")
                .flatMap(body -> Mono.error(new IllegalStateException(
                    "Upstream error: " + res.statusCode() + " " + body)))
        )
        .bodyToMono(AiQuestionResponse.class)
        .block(Duration.ofSeconds(60));
  }

  private String getClientId(Integer code) {
    int selectedCode = resolveClientCode(code);
    Map<Integer, String> clients = aiClientProperties.getClients();
    // 기본값 key=1 가정
    return clients.getOrDefault(selectedCode, clients.get(1));
  }

  private int resolveClientCode(Integer code) {
    Map<Integer, String> clientMap = aiClientProperties.getClients();

    if (code != null && clientMap.containsKey(code)) {
      return code;
    }

    if (clientMap.isEmpty()) {
      return 1;
    }
    int index = (int) (System.currentTimeMillis() % clientMap.size());
    return clientMap.keySet().stream()
        .sorted()
        .skip(index)
        .findFirst()
        .orElseGet(() -> clientMap.keySet().iterator().next());
  }

  private String nvl(String s) {
    return s == null ? "" : s.trim();
  }

  private void logWithElapsed(String label, Integer code, long startMs, String message) {
    long elapsedMs = System.currentTimeMillis() - startMs;
    log.info("\n🧠 {} 완료, code:{} ({}ms): {}", label, code, elapsedMs, message);
  }

}