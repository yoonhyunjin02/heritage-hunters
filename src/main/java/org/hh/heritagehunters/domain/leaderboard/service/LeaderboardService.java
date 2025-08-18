package org.hh.heritagehunters.domain.leaderboard.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.leaderboard.dto.LeaderboardUserDto;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

  private final UserRepository userRepository;
  private final Random random = new Random(); // 재사용할 랜덤 객체

  // 점수 상위 24명 가져와서 DTO로 변환
  public List<LeaderboardUserDto> getTopUsers() {
    List<User> topUsers = userRepository.findTop24ByOrderByScoreDesc();

    List<LeaderboardUserDto> dtos = topUsers.stream()
        .map(this::mapToDtoWithDefaultImage)
        .collect(Collectors.toList());

    for (int i = 0; i < dtos.size(); i++) {
      dtos.get(i).setRank(i + 1); // 1위부터 순위 부여
    }

    return dtos;
  }

  public LeaderboardUserDto getCurrentUser(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));

    LeaderboardUserDto dto = mapToDtoWithDefaultImage(user);

    int rank = userRepository.findRankByEmail(email); // DB에서 바로 순위 계산
    dto.setRank(rank);

    return dto;
  }

  // User → LeaderboardUserDto 변환 시 랜덤 프로필 처리
  private LeaderboardUserDto mapToDtoWithDefaultImage(User user) {
    LeaderboardUserDto dto = LeaderboardUserDto.fromEntity(user);

    if (dto.getProfileImage() == null || dto.getProfileImage().isBlank()) {
      int idx = random.nextInt(4) + 1; // 1~4
      dto.setProfileImage("/images/profile/profile" + idx + ".png");
    }

    return dto;
  }
}