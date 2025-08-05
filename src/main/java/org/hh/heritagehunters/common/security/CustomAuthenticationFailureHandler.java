package org.hh.heritagehunters.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import java.io.IOException;

public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

  @Override
  public void onAuthenticationFailure(HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException exception) throws IOException {

    // 예외 유형에 따라 메시지 분기 처리
    String errorMessage;

    if (exception instanceof UsernameNotFoundException) {
      errorMessage = "존재하지 않는 이메일입니다.";
    } else if (exception instanceof BadCredentialsException) {
      errorMessage = "비밀번호가 일치하지 않습니다.";
    } else {
      errorMessage = "로그인에 실패했습니다. 다시 시도해주세요.";
    }

    // 메시지를 세션에 저장
    request.getSession().setAttribute("LOGIN_ERROR", errorMessage);

    // 로그인 페이지로 리다이렉트
    response.sendRedirect("/login");
  }
}