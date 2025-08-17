package org.hh.heritagehunters.domain.profile.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StampItemDto {

  private final Long heritageId;
  private final String name;
  private final String imageUrl;     // Heritage.thumbnailUrl
  private final boolean obtained;    // 해당 유저가 이 heritage로 글을 썼는지
  private final LocalDateTime obtainedAt; // 최초 작성일, 미획득이면 null
}
