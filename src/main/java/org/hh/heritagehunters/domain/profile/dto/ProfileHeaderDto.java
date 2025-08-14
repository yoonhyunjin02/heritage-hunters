package org.hh.heritagehunters.domain.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfileHeaderDto {

  private final Long userId;
  private final String nickname;
  private final String email;
  private final String profileImage;
  private final Integer score;
}

