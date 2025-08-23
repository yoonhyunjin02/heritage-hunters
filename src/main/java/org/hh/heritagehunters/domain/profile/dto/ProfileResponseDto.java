package org.hh.heritagehunters.domain.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.hh.heritagehunters.domain.oauth.entity.User;

@Getter
@AllArgsConstructor(staticName = "from")
public class ProfileResponseDto {
  private Long userId;
  private String nickname;
  private String bio;
  private String profileImageUrl;

  public static ProfileResponseDto from(User user) {
    return new ProfileResponseDto(
        user.getId(),
        user.getNickname(),
        user.getBio(),
        user.getProfileImage()
    );
  }
}
