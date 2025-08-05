package org.hh.heritagehunters.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import java.io.IOException;

public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

  @Override
  public void onAuthenticationFailure(HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException exception) throws IOException {

    // 1. 로그인 에러 메시지 세션에 저장 (한 번만 보여주기)
    request.getSession().setAttribute("LOGIN_ERROR", "이메일 또는 비밀번호가 올바르지 않습니다.");

    // 2. 로그인 페이지로 리다이렉트
    response.sendRedirect("/login");
  }
}