package org.hh.heritagehunters.domain.oauth.controller;

import org.hh.heritagehunters.common.exception.DuplicateEmailException;
import org.hh.heritagehunters.domain.oauth.service.RegisterService;
import org.hh.heritagehunters.testsupport.FormTestUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;


import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RegisterController.class)
@AutoConfigureMockMvc
class RegisterControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private RegisterService registerService;

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
        .andExpect(status().isOk())
        .andExpect(view().name("features/oauth/register"))
        .andExpect(model().attributeExists("registerError"));
  }
}
