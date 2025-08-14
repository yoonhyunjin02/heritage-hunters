package org.hh.heritagehunters.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateRequestDto {

  @NotBlank(message = "댓글 내용은 필수입니다.")
  @Size(max = 200, message = "댓글은 200자를 초과할 수 없습니다.")
  private String content;
}
