package org.hh.heritagehunters.domain.post.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class PostCreateDto {

  @NotBlank(message = "게시글 내용을 입력해주세요.")
  @Size(max = 200, message = "게시글은 200자 이내로 작성해주세요.")
  private String content;

  @NotBlank(message = "위치를 선택해주세요.")
  private String location;

  /**
   * Google Maps에서 선택한 위치의 좌표
   */
  private BigDecimal latitude;
  private BigDecimal longitude;

  /**
   * Google Maps Place ID (선택사항)
   */
  private String placeId;
}
