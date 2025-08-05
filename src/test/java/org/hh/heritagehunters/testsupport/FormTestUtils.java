package org.hh.heritagehunters.testsupport;

import org.hh.heritagehunters.domain.oauth.dto.RegisterDto;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class FormTestUtils {

  public static RegisterDto createValidRegisterDto() {
    return RegisterDto.builder()
        .email("user@example.com")
        .nickname("nickname")
        .password("Password1!")
        .passwordConfirm("Password1!")
        .build();
  }

  public static RegisterDto createPasswordMismatchDto() {
    return RegisterDto.builder()
        .email("user@example.com")
        .nickname("nickname")
        .password("Password1!")
        .passwordConfirm("WrongPassword1!")
        .build();
  }

  public static MockHttpServletRequestBuilder createValidRegisterPostRequest() {
    return post("/register")
        .param("email", "user@example.com")
        .param("nickname", "nickname")
        .param("password", "Password1!")
        .param("passwordConfirm", "Password1!")
        .with(csrf());
  }

  public static MockHttpServletRequestBuilder createInvalidEmailPostRequest() {
    return post("/register")
        .param("email", "invalid-email")
        .param("nickname", "nickname")
        .param("password", "Password1!")
        .param("passwordConfirm", "Password1!")
        .with(csrf());
  }
}