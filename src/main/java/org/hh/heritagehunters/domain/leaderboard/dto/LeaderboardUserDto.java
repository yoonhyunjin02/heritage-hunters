package org.hh.heritagehunters.domain.leaderboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardUserDto {
  private Long id;
  private String nickname;
  private String profileImage;
  private Integer score;
  private Integer rank;

  // User 엔티티 -> DTO 변환 메서드
  public static LeaderboardUserDto fromEntity(User user) {
    return new LeaderboardUserDto(
        user.getId(),
        user.getNickname(),
        user.getProfileImage(),
        user.getScore(),
        null
    );
  }
}