package org.hh.heritagehunters.domain.oauth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.dto.RegisterDto;
import org.hh.heritagehunters.domain.oauth.service.RegisterService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class OauthController {

  private final RegisterService registerService;

  // 회원가입 페이지 이동
  @GetMapping("/register")
  public String showRegisterForm(Model model) {
    model.addAttribute("registerDto", new RegisterDto());
    return "features/oauth/register";
  }

  // 회원가입 처리
  @PostMapping("/register")
  public String processRegister(
      @Valid @ModelAttribute RegisterDto registerDto,
      BindingResult bindingResult,
      Model model
  ) {
    if (bindingResult.hasErrors()) {
      return "features/oauth/register";
    }

    try {
      registerService.register(registerDto);
    } catch (RuntimeException e) {
      model.addAttribute("registerError", e.getMessage());
      return "features/oauth/register";
    }

    return "redirect:/login";
  }

  // 로그인 폼 이동
  @GetMapping("/login")
  public String loginPage(HttpServletRequest request, Model model) {
    String errorMessage = (String) request.getSession().getAttribute("LOGIN_ERROR");

    if (errorMessage != null) {
      model.addAttribute("loginError", errorMessage);
      request.getSession().removeAttribute("LOGIN_ERROR");
    }

    return "features/oauth/login";
  }
}
