package org.hh.heritagehunters.domain.oauth.controller;

import org.hh.heritagehunters.common.exception.oauth.DuplicateEmailException;
import org.hh.heritagehunters.domain.oauth.service.RegisterService;
import org.hh.heritagehunters.testsupport.FormTestUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;


import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OauthControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockitoBean
  private RegisterService registerService;

  // 회원가입 테스트
  @Test
  @DisplayName("회원가입 페이지 GET 요청 시 register 템플릿 반환")
  @WithMockUser
  void showRegisterForm() throws Exception {
    mockMvc.perform(get("/register"))
        .andExpect(status().isOk())
        .andExpect(view().name("features/oauth/register"))
        .andExpect(model().attributeExists("registerDto"));
  }

  @Test
  @DisplayName("입력값 오류가 있을 경우 다시 회원가입 폼 반환")
  @WithMockUser
  void whenInvalidInput_thenReturnsForm() throws Exception {
    mockMvc.perform(FormTestUtils.createInvalidEmailPostRequest())
        .andExpect(status().isOk())
        .andExpect(view().name("features/oauth/register"))
        .andExpect(model().hasErrors());
  }

  @Test
  @DisplayName("회원가입 성공 시 로그인 페이지로 리다이렉트")
  @WithMockUser
  void whenValidInput_thenRedirectToLogin() throws Exception {
    mockMvc.perform(FormTestUtils.createValidRegisterPostRequest())
        .andDo(print())
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/login"));

    verify(registerService, times(1)).register(any());
  }

  @Test
  @DisplayName("서비스 예외 발생 시 에러 메시지 포함해 다시 폼 반환")
  @WithMockUser
  void whenDuplicateEmail_thenShowError() throws Exception {
    doThrow(new DuplicateEmailException()).when(registerService).register(any());

    mockMvc.perform(FormTestUtils.createValidRegisterPostRequest())
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(view().name("features/oauth/register"))
        .andExpect(model().attributeExists("registerError"));
  }

  // 로그인 테스트
  @Test
  @DisplayName("로그인 페이지 GET 요청 시 login 템플릿 반환")
  @WithAnonymousUser
  void showLoginForm() throws Exception {
    mockMvc.perform(get("/login"))
        .andExpect(status().isOk())
        .andExpect(view().name("features/oauth/login"));
  }

  @Test
  @DisplayName("유효한 로그인 정보로 로그인 시 /main 으로 리다이렉트")
  void loginWithValidCredentials_redirectsToMain() throws Exception {
    mockMvc.perform(FormTestUtils.createValidLoginPostRequest())
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/main"));
  }

  @Test
  @DisplayName("유효하지 않은 로그인 정보로 로그인 시 /login?error 로 리다이렉트")
  void loginWithInvalidCredentials_redirectsToLoginWithError() throws Exception {
    mockMvc.perform(FormTestUtils.createInvalidEmailLoginRequest())
        .andExpect(status().is3xxRedirection())
        .andExpect(redirectedUrl("/login"));
  }
}