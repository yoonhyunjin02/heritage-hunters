package org.hh.heritagehunters.domain.search.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "AiResetRequest", description = "AI 상태 초기화 요청")
public class AiResetRequest {
  @Schema(description = "리셋할 요청 타입", example = "recommends")
  private String type;
  @Schema(description = "클라이언트 코드 (1-3)", example = "1")
  private Integer code;
}


