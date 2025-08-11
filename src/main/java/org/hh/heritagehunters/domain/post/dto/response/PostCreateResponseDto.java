package org.hh.heritagehunters.domain.post.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PostCreateResponseDto {
  private Long postId;
  private String message;
  private int pointsEarned;
}
