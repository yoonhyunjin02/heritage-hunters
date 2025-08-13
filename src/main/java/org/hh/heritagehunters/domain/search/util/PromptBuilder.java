package org.hh.heritagehunters.domain.search.util;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.search.dto.AiType;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PromptBuilder {

  public String build(AiType type, String name, String address, String content) {
    return switch (type) {
      case recommends -> String.format(
          "%s과 관련되어 있는, %s 주변의 맛집, 활동, 체험 등과 같은 추천할만한 방문지를 종합해서 이 곳을 처음 방문하는 관광객에게 추천하는 말투로 요약해서 출력해.",
          name, address
      );
      case weather -> String.format(
          "%s 위치의 오늘 현재 날씨 정보 (날씨 상태, 기온, 체감 온도, 강수 여부 포함)를 두 줄 이내로 출력해.",
          address
      );
      case news -> String.format(
          "%s에 대해 최근 1~2년 내에 발생한 **문화재 지정 변경, 복원 사업, 훼손 사건, 보존 정책 등 행정적 변화나 논란**이 있다면, 해당 내용을 정중한 말투로 두 줄 요약해서 알려줘. 단순한 지역 뉴스나 다른 문화유산 관련 내용은 제외해.",
          name
      );
      case summary -> {
        String sliced = content.length() > 960 ? content.substring(0, 960) : content;
        yield "다음 내용을 2줄 이내로 요약해: " + sliced;
      }
      default -> throw new IllegalArgumentException("지원하지 않는 요청 타입입니다.");
    };
  }
}
