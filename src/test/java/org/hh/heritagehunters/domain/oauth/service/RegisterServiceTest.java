package org.hh.heritagehunters.domain.oauth.service;

import org.hh.heritagehunters.common.exception.oauth.DuplicateEmailException;
import org.hh.heritagehunters.common.exception.oauth.DuplicateNicknameException;
import org.hh.heritagehunters.common.exception.oauth.PasswordMismatchException;
import org.hh.heritagehunters.domain.oauth.dto.RegisterDto;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.testsupport.FormTestUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RegisterServiceTest {

  @InjectMocks
  private RegisterService registerService;

  @Mock
  private UserRepository userRepository;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Test
  @DisplayName("이메일이 중복되면 DuplicateEmailException 발생")
  void duplicateEmailThrowsException() {
    RegisterDto dto = FormTestUtils.createValidRegisterDto();
    given(userRepository.existsByEmail(dto.getEmail())).willReturn(true);

    assertThatThrownBy(() -> registerService.register(dto))
        .isInstanceOf(DuplicateEmailException.class)
        .hasMessage("이미 사용 중인 이메일입니다.");
  }

  @Test
  @DisplayName("닉네임이 중복되면 DuplicateNicknameException 발생")
  void duplicateNicknameThrowsException() {
    RegisterDto dto = FormTestUtils.createValidRegisterDto();
    given(userRepository.existsByEmail(dto.getEmail())).willReturn(false);
    given(userRepository.existsByNickname(dto.getNickname())).willReturn(true);

    assertThatThrownBy(() -> registerService.register(dto))
        .isInstanceOf(DuplicateNicknameException.class)
        .hasMessage("이미 사용 중인 닉네임입니다.");
  }

  @Test
  @DisplayName("비밀번호 확인이 일치하지 않으면 PasswordMismatchException 발생")
  void passwordMismatchThrowsException() {
    RegisterDto dto = FormTestUtils.createPasswordMismatchDto();
    given(userRepository.existsByEmail(dto.getEmail())).willReturn(false);
    given(userRepository.existsByNickname(dto.getNickname())).willReturn(false);

    assertThatThrownBy(() -> registerService.register(dto))
        .isInstanceOf(PasswordMismatchException.class)
        .hasMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
  }

  @Test
  @DisplayName("정상적인 요청이면 예외 없이 저장")
  void successfulRegistration() {
    RegisterDto dto = FormTestUtils.createValidRegisterDto();
    given(userRepository.existsByEmail(anyString())).willReturn(false);
    given(userRepository.existsByNickname(anyString())).willReturn(false);
    given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");

    assertDoesNotThrow(() -> registerService.register(dto));
    verify(userRepository, times(1)).save(any(User.class));
  }
}