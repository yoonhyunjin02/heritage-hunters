package org.hh.heritagehunters.domain.oauth.service;

import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

  @Mock
  UserRepository userRepository;

  @InjectMocks
  CustomUserDetailsService service;

  @Test
  @DisplayName("이메일로 사용자 존재 → CustomUserDetails 반환하고 레포지토리 호출 검증")
  void loadUserByUsername_found_returnsDetails() {
    // given
    String email = "tester@example.com";
    User user = mock(User.class); // 엔티티 필드 의존을 피하려고 mock 사용
    when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

    // when
    UserDetails details = service.loadUserByUsername(email);

    // then
    assertThat(details).isNotNull();
    assertThat(details).isInstanceOf(CustomUserDetails.class);

    ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
    verify(userRepository, times(1)).findByEmail(captor.capture());
    assertThat(captor.getValue()).isEqualTo(email);

    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("이메일로 사용자 없음 → UsernameNotFoundException 발생")
  void loadUserByUsername_notFound_throws() {
    // given
    String email = "notfound@example.com";
    when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

    // when & then
    assertThrows(UsernameNotFoundException.class,
        () -> service.loadUserByUsername(email));

    verify(userRepository, times(1)).findByEmail(email);
    verifyNoMoreInteractions(userRepository);
  }
}
