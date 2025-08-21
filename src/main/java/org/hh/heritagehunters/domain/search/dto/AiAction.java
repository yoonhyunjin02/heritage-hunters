package org.hh.heritagehunters.domain.search.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "AiAction", description = "AI 액션 정보")
public class AiAction {

  @Schema(description = "액션 이름", example = "smile")
  private String name;
  @Schema(description = "발화 내용", example = "안녕하세요!")
  private String speak;
}