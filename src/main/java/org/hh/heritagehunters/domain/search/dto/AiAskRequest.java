package org.hh.heritagehunters.domain.search.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "AiAskRequest", description = "AI 질문 요청")
public class AiAskRequest {
  @Schema(description = "요청 타입: recommend|weather|news|summary", example = "recommends", requiredMode = Schema.RequiredMode.REQUIRED)
  private String type;
  @Schema(description = "클라이언트 코드 (1-3, 선택사항)", example = "1")
  private Integer code;
  @Schema(description = "문화유산 이름 (추천/뉴스용 필수)", example = "경복궁")
  private String name;
  @Schema(description = "주소 (추천/날씨용 필수)", example = "서울특별시 종로구 사직로 161")
  private String address;
  @Schema(description = "내용 (요약용 선택사항)", example = "궁궐의 역사")
  private String content;
}