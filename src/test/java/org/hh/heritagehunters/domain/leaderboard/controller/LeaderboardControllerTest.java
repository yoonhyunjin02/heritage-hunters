package org.hh.heritagehunters.domain.leaderboard.controller;

import org.hh.heritagehunters.domain.leaderboard.dto.LeaderboardUserDto;
import org.hh.heritagehunters.domain.leaderboard.service.LeaderboardService;
import org.hh.heritagehunters.domain.oauth.service.CustomUserDetailsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.sameInstance;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LeaderboardController.class)
@AutoConfigureMockMvc(addFilters = false) // 보안 필터 off(리다이렉트 방지)
class LeaderboardControllerTest {

  @Autowired
  MockMvc mockMvc;

  @MockitoBean
  LeaderboardService leaderboardService;

  // CurrentUserAdvice가 주입받는 빈을 목으로 제공해 컨텍스트 로딩 오류 방지
  @MockitoBean
  CustomUserDetailsService customUserDetailsService;

  @Test
  @DisplayName("GET /leaderboards: 비로그인 시 top 목록만 모델에 담고 currentUser=null, 뷰 이름 반환")
  void leaderboard_anonymous() throws Exception {
    // given
    LeaderboardUserDto u1 = Mockito.mock(LeaderboardUserDto.class);
    LeaderboardUserDto u2 = Mockito.mock(LeaderboardUserDto.class);
    List<LeaderboardUserDto> top = List.of(u1, u2);
    when(leaderboardService.getTopUsers()).thenReturn(top);

    // when/then
    mockMvc.perform(get("/leaderboards"))
        .andExpect(status().isOk())
        .andExpect(view().name("features/leaderboard/leaderboard"))
        .andExpect(model().attributeExists("users"))
        .andExpect(model().attribute("users", top))
        .andExpect(model().attribute("currentUser", nullValue()));

    verify(leaderboardService, times(1)).getTopUsers();
    verify(leaderboardService, never()).getCurrentUser(anyString());
    verifyNoMoreInteractions(leaderboardService);
  }

  @Test
  @WithMockUser(username = "me@example.com")
  @DisplayName("GET /leaderboards: 로그인 시 currentUser 포함, 서비스에 이메일 전달")
  void leaderboard_loggedIn() throws Exception {
    // given
    LeaderboardUserDto u1 = Mockito.mock(LeaderboardUserDto.class);
    List<LeaderboardUserDto> top = List.of(u1);
    when(leaderboardService.getTopUsers()).thenReturn(top);

    LeaderboardUserDto me = Mockito.mock(LeaderboardUserDto.class);
    when(leaderboardService.getCurrentUser("me@example.com")).thenReturn(me);

    // (안전용) 어드바이스가 호출할 수 있으므로 최소 스텁
    when(customUserDetailsService.loadUserByUsername("me@example.com"))
        .thenReturn(User.withUsername("me@example.com").password("N/A").authorities("ROLE_USER").build());

    // when/then
    mockMvc.perform(get("/leaderboards"))
        .andExpect(status().isOk())
        .andExpect(view().name("features/leaderboard/leaderboard"))
        .andExpect(model().attribute("users", top))
        .andExpect(model().attribute("currentUser", sameInstance(me)));

    verify(leaderboardService).getTopUsers();
    verify(leaderboardService).getCurrentUser("me@example.com");
    verifyNoMoreInteractions(leaderboardService);
  }
}
