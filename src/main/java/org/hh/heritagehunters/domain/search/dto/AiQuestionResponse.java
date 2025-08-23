package org.hh.heritagehunters.domain.search.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "AiQuestionResponse", description = "AI 질문 응답")
public class AiQuestionResponse {

  @Schema(description = "AI 액션 정보 (name과 speak 포함)")
  private AiAction action;
  @Schema(description = "AI 응답 내용", example = "경복궁은 조선왕조의 정궁으로...")
  private String content;
}
