package org.hh.heritagehunters.common.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import jakarta.servlet.http.HttpSession;

import static org.junit.jupiter.api.Assertions.*;

class CustomAuthenticationFailureHandlerTest {

  private final CustomAuthenticationFailureHandler handler = new CustomAuthenticationFailureHandler();

  @Test
  @DisplayName("UsernameNotFoundException이면: 세션에 메시지 저장 후 /login 으로 302 리다이렉트")
  void onAuthenticationFailure_usernameNotFound() throws Exception {
    // given
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    AuthenticationException ex = new UsernameNotFoundException("no such user");

    // when
    handler.onAuthenticationFailure(request, response, ex);

    // then
    HttpSession session = request.getSession(false);
    assertNotNull(session, "세션이 생성되어야 함");
    assertEquals("존재하지 않는 이메일입니다.", session.getAttribute("LOGIN_ERROR"));

    assertEquals(302, response.getStatus());
    assertEquals("/login", response.getRedirectedUrl());
  }

  @Test
  @DisplayName("BadCredentialsException이면: 비밀번호 불일치 메시지 + /login 리다이렉트")
  void onAuthenticationFailure_badCredentials() throws Exception {
    // given
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    AuthenticationException ex = new BadCredentialsException("bad pw");

    // when
    handler.onAuthenticationFailure(request, response, ex);

    // then
    HttpSession session = request.getSession(false);
    assertNotNull(session);
    assertEquals("비밀번호가 일치하지 않습니다.", session.getAttribute("LOGIN_ERROR"));

    assertEquals(302, response.getStatus());
    assertEquals("/login", response.getRedirectedUrl());
  }

  @Test
  @DisplayName("그 외 예외면: 일반 실패 메시지 + /login 리다이렉트")
  void onAuthenticationFailure_others() throws Exception {
    // given
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();
    AuthenticationException ex = new AuthenticationException("something else") {};

    // when
    handler.onAuthenticationFailure(request, response, ex);

    // then
    HttpSession session = request.getSession(false);
    assertNotNull(session);
    assertEquals("로그인에 실패했습니다. 다시 시도해주세요.", session.getAttribute("LOGIN_ERROR"));

    assertEquals(302, response.getStatus());
    assertEquals("/login", response.getRedirectedUrl());
  }
}
