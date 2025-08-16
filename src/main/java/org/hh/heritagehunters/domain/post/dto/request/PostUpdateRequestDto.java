package org.hh.heritagehunters.domain.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostUpdateRequestDto {

  @NotBlank(message = "게시글 내용은 필수입니다.")
  @Size(max = 300, message = "게시글 내용은 300자를 초과할 수 없습니다.")
  private String content;

  @NotBlank(message = "위치 정보는 필수입니다.")
  private String location;
}
