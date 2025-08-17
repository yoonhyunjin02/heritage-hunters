package org.hh.heritagehunters.domain.leaderboard.service;

import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.leaderboard.dto.LeaderboardUserDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * LeaderboardService 단위 테스트
 * - UserRepository만 목으로 주입
 * - User 엔티티는 Mockito로 스텁(게터만 동작)
 */
@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

  @org.mockito.Mock
  UserRepository userRepository;

  @org.mockito.InjectMocks
  LeaderboardService leaderboardService;

  /**
   * 테스트에서 실제로 사용하는 게터만 스텁한다.
   * (getEmail/getScore 스텁은 불필요 → UnnecessaryStubbingException 방지)
   */
  private User mockUser(String email, String nickname, int score, String profileImage) {
    User u = mock(User.class);
    when(u.getNickname()).thenReturn(nickname);
    when(u.getProfileImage()).thenReturn(profileImage);
    return u;
  }

  @Test
  @DisplayName("getTopUsers: 레포 결과를 DTO로 매핑하고 1부터 순위 부여")
  void getTopUsers_assignsRanks_andMaps() {
    // given: 점수 내림차순으로 리포지토리가 반환한다고 가정
    User u1 = mockUser("a@a.com", "A", 300, null);            // 기본 이미지 경로로 대체되어야 함
    User u2 = mockUser("b@b.com", "B", 200, "/img/b.png");    // 지정 이미지 유지
    User u3 = mockUser("c@c.com", "C", 100, "");              // 빈 문자열 → 기본 이미지

    when(userRepository.findTop24ByOrderByScoreDesc())
        .thenReturn(List.of(u1, u2, u3));

    // when
    List<LeaderboardUserDto> dtos = leaderboardService.getTopUsers();

    // then
    assertEquals(3, dtos.size(), "DTO 개수");

    // 순위는 1부터
    assertEquals(1, dtos.get(0).getRank());
    assertEquals(2, dtos.get(1).getRank());
    assertEquals(3, dtos.get(2).getRank());

    // 매핑 검증(닉네임)
    assertEquals("A", dtos.get(0).getNickname());
    assertEquals("B", dtos.get(1).getNickname());
    assertEquals("C", dtos.get(2).getNickname());

    // 프로필 이미지: null/blank면 기본 이미지(/images/profile/profile1~4.png), 지정된 건 유지
    String img0 = dtos.get(0).getProfileImage();
    assertNotNull(img0);
    assertTrue(img0.matches("^/images/profile/profile[1-4]\\.png$"));

    assertEquals("/img/b.png", dtos.get(1).getProfileImage());

    String img2 = dtos.get(2).getProfileImage();
    assertNotNull(img2);
    assertTrue(img2.matches("^/images/profile/profile[1-4]\\.png$"));

    verify(userRepository, times(1)).findTop24ByOrderByScoreDesc();
    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("getCurrentUser: 이메일로 유저 조회 → DTO 매핑 + 레포에서 순위 조회 반영")
  void getCurrentUser_returnsDtoWithRank() {
    // given
    String email = "me@example.com";
    User me = mockUser(email, "Me", 777, null); // 기본 이미지로 대체 예상

    when(userRepository.findByEmail(email)).thenReturn(Optional.of(me));
    when(userRepository.findRankByEmail(email)).thenReturn(5);

    // when
    LeaderboardUserDto dto = leaderboardService.getCurrentUser(email);

    // then
    assertEquals("Me", dto.getNickname());
    assertEquals(5, dto.getRank());
    assertNotNull(dto.getProfileImage());
    assertTrue(dto.getProfileImage().matches("^/images/profile/profile[1-4]\\.png$"));

    verify(userRepository).findByEmail(email);
    verify(userRepository).findRankByEmail(email);
    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("getCurrentUser: 이메일로 유저를 못 찾으면 RuntimeException 발생")
  void getCurrentUser_userNotFound_throws() {
    // given
    when(userRepository.findByEmail("none@example.com")).thenReturn(Optional.empty());

    // when / then
    RuntimeException ex = assertThrows(RuntimeException.class,
        () -> leaderboardService.getCurrentUser("none@example.com"));
    assertTrue(ex.getMessage() == null || ex.getMessage().contains("User not found"));

    verify(userRepository).findByEmail("none@example.com");
    verifyNoMoreInteractions(userRepository);
  }
}
