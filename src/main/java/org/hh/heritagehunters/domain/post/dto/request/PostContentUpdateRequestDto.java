package org.hh.heritagehunters.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 게시글 본문(content)만 수정하기 위한 전용 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostContentUpdateRequestDto {

  @NotBlank(message = "게시글 내용은 필수입니다.")
  @Size(max = 300, message = "게시글 내용은 300자를 초과할 수 없습니다.")
  private String content;

}
