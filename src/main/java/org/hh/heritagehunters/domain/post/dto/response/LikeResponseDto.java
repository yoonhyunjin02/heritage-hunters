package org.hh.heritagehunters.domain.post.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LikeResponseDto {
  private boolean liked;   // true = 좋아요, false = 취소
  private int likeCount;   // 현재 좋아요 수
}
