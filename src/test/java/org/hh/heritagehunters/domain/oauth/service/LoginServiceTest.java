package org.hh.heritagehunters.domain.oauth.service;

import org.hh.heritagehunters.domain.oauth.dto.LoginDto;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.common.exception.oauth.LoginFailedException;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;

import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

  @InjectMocks
  private LoginService loginService;

  @Mock
  private UserRepository userRepository;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Test
  @DisplayName("존재하지 않는 이메일로 로그인 시 예외 발생")
  void loginWithNonExistingEmail_shouldFail() {
    // given
    LoginDto dto = new LoginDto("notfound@example.com", "password");
    given(userRepository.findByEmail(dto.getEmail())).willReturn(Optional.empty());

    // when & then
    assertThrows(LoginFailedException.class, () -> loginService.login(dto));
  }

  @Test
  @DisplayName("비밀번호가 틀리면 로그인 실패")
  void loginWithWrongPassword_shouldFail() {
    // given
    LoginDto dto = new LoginDto("test@example.com", "wrongPassword");

    User user = new User();
    user.setEmail("test@example.com");
    user.setPassword("encodedPassword"); // 저장된 암호

    given(userRepository.findByEmail(dto.getEmail())).willReturn(Optional.of(user));
    given(passwordEncoder.matches(dto.getPassword(), user.getPassword())).willReturn(false);

    // when & then
    assertThrows(LoginFailedException.class, () -> loginService.login(dto));
  }

  @Test
  @DisplayName("이메일과 비밀번호가 일치하면 로그인 성공")
  void loginWithCorrectCredentials_shouldSucceed() {
    // given
    LoginDto dto = new LoginDto("test@example.com", "correctPassword");

    User user = new User();
    user.setEmail("test@example.com");
    user.setPassword("encodedPassword");

    given(userRepository.findByEmail(dto.getEmail())).willReturn(Optional.of(user));
    given(passwordEncoder.matches(dto.getPassword(), user.getPassword())).willReturn(true);

    // when
    User result = loginService.login(dto);

    // then
    assertThat(result).isEqualTo(user);
  }
}
