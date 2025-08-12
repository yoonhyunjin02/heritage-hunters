package org.hh.heritagehunters.domain.search.service;

import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.domain.search.dto.AiAskRequest;
import org.hh.heritagehunters.domain.search.dto.AiQuestionResponse;
import org.hh.heritagehunters.domain.search.dto.AiResetRequest;
import org.hh.heritagehunters.domain.search.dto.AiType;
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

  private static final Map<Integer, String> CLIENT_IDS = Map.of(
      1, "2c99d088-1967-4d31-b3c8-7c3403a15081", // 유동혁
      2, "d8929ecb-f072-43ad-9c1a-2536c9fd5452", // 윤현진
      3, "c0e8b09e-c3be-495c-8391-51e2a4543c96"  // 이수완
  );

  public AiQuestionResponse ask(Long heritageId, AiAskRequest req) {
    AiType type = AiType.from(req.getType());
    String prompt = buildPrompt(type,
        nvl(req.getName()),
        nvl(req.getAddress()),
        nvl(req.getContent())
    );

    int selectedCode = resolveClientCode(req.getCode(), heritageId);
    String clientId = CLIENT_IDS.getOrDefault(selectedCode, CLIENT_IDS.get(1));

    long start = System.currentTimeMillis(); // 요청 시각 측정

    AiQuestionResponse response = aiWebClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/api/v1/question")
            .queryParam("content", prompt)
            .queryParam("client_id", clientId)
            .build())
        .retrieve()
        .onStatus(HttpStatusCode::isError, res ->
            res.bodyToMono(String.class)
                .defaultIfEmpty("AI upstream error")
                .flatMap(
                    body -> Mono.error(new IllegalStateException("Upstream error: " + res.statusCode() + " " + body)))
        )
        .bodyToMono(AiQuestionResponse.class)
        .block(Duration.ofSeconds(60));


    long end = System.currentTimeMillis(); // 응답 시각 측정
    long elapsedMs = end - start;

    log.info("🧠 AI 요청 완료 ({}ms)\n📤 content: {}\n📥 응답: {}", elapsedMs, prompt, response);
    return response;
  }

  private int resolveClientCode(Integer code, Long heritageId) {
    if (code != null && CLIENT_IDS.containsKey(code)) {
      return code;
    }
    int rot = (int) ((heritageId % 3) + 1);
    return CLIENT_IDS.containsKey(rot) ? rot : 1;
  }

  private String buildPrompt(AiType type, String name, String address, String content) {
    return switch (type) {
      case recommends ->
          name + "과 관련되어 있는, " + address + " 주변의 추천할만한 맛집, 활동, 체험을 각각 하나씩 골라서 두 줄 이내의 문장으로 요약해서 출력해.";
      case weather -> address + " 위치의 오늘 현재 날씨 정보 (날씨 상태, 기온, 체감 온도, 강수 여부 포함)를 두 줄 이내로 출력해.";
      case news -> name + "에 대해 최근 1~2년 내에 발생한 **문화재 지정 변경, 복원 사업, 훼손 사건, 보존 정책 등 행정적 변화나 논란**이 있다면, 해당 내용을 두 줄 이내로 요약해서 알려줘. 단순한 지역 뉴스나 다른 문화유산 관련 내용은 제외해.";
      case summary -> {
        String sliced = content.length() > 960 ? content.substring(0, 960) : content;
        yield "다음 내용을 2줄 이내로 요약해: " + sliced;
      }
      default -> throw new IllegalArgumentException("지원하지 않는 요청 타입입니다.");
    };
  }

  private String nvl(String s) {
    return s == null ? "" : s.trim();
  }

  public void resetState(Long heritageId, AiResetRequest req) {
    int selectedCode = resolveClientCode(req.getCode(), heritageId);
    String clientId = CLIENT_IDS.getOrDefault(selectedCode, CLIENT_IDS.get(1));

    aiWebClient
        .method(HttpMethod.DELETE)
        .uri("/api/v1/reset-state")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(Map.of("client_id", clientId))
        .retrieve()
        .toBodilessEntity()
        .block(Duration.ofSeconds(10)); // 적절한 타임아웃
  }

}