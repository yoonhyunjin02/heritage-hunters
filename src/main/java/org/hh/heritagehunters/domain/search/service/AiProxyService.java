package org.hh.heritagehunters.domain.search.service;

import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.search.dto.AiQuestionResponse;
import org.hh.heritagehunters.domain.search.dto.AiType;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AiProxyService {

  private final WebClient aiWebClient;
  private final HeritageRepository heritageRepository;

  private static final Map<Integer, String> CLIENT_IDS = Map.of(
      1, "2c99d088-1967-4d31-b3c8-7c3403a15081", // 유동혁
      2, "d8929ecb-f072-43ad-9c1a-2536c9fd5452", // 윤현진
      3, "c0e8b09e-c3be-495c-8391-51e2a4543c96"  // 이수완
  );

  public AiQuestionResponse ask(Long heritageId, String typeStr, Integer code) {
    Heritage h = heritageRepository.findById(heritageId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

    AiType type = AiType.from(typeStr);
    String prompt = buildPrompt(type, h);

    int selectedCode = resolveClientCode(code, heritageId);
    String clientId = CLIENT_IDS.getOrDefault(selectedCode, CLIENT_IDS.get(1));

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
                .flatMap(body -> Mono.error(new IllegalStateException("Upstream error: " + res.statusCode() + " " + body)))
        )
        .bodyToMono(AiQuestionResponse.class)
        .block(Duration.ofSeconds(15));
  }

  private int resolveClientCode(Integer code, Long heritageId) {
    if (code != null && CLIENT_IDS.containsKey(code)) return code;
    // id 기반 로테이션: 1,2,3
    int rot = (int) ((heritageId % 3) + 1);
    return CLIENT_IDS.containsKey(rot) ? rot : 1;
  }

  private String buildPrompt(AiType type, Heritage h) {
    String name = nvl(h.getName());
    String address = nvl(h.getAddress());
    String content = nvl(h.getDescription());
    switch (type) {
      case recommends:
        return "\"" + name + "\"과 관련되어 있는, \"" + address + "\" 주변의 추천할만한 맛집, 활동, 체험을 각각 하나씩 골라서 두 줄 이내의 문장으로 요약해서 출력해.";
      case weather:
        return "\"" + address + "\" 위치의 오늘 현재 날씨 정보 (날씨 상태, 기온, 체감 온도, 강수 여부 포함)를 두 줄 이내로 출력해.";
      case news:
        return "\"" + name + "\"과 관련되어 있는, \"" + address + "\" 주변의 국가 문화 유산 관련 최근 뉴스 기사를 찾아서 두 줄 이내로 요약해서 출력해.";
      case summary:
        String sliced = content.length() > 960 ? content.substring(0, 960) : content;
        return "큰 따옴표 세 개로 표시된 내용을 두 줄 이내로 요약해. \"\"\"" + sliced + "\"\"\"";
      default:
        throw new IllegalArgumentException("Unsupported ai type: " + type);
    }
  }

  private String nvl(String s) { return s == null ? "" : s.trim(); }
}
