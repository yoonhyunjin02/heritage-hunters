package org.hh.heritagehunters.domain.oauth.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/register")
@RequiredArgsConstructor
public class RegisterController {

  private final RegisterService registerService;

  @GetMapping
  public String showRegisterForm(Model model) {
    model.addAttribute("registerDto", new RegisterDto());
    return "features/oauth/register";
  }

  @PostMapping
  public String processRegister(
      @Valid @ModelAttribute RegisterDto registerDto,
      BindingResult bindingResult,
      Model model
  ) {
    if (bindingResult.hasErrors()) {
      return "features/oauth/register";
    }

    registerService.register(registerDto);
    return "redirect:/login";
  }
}
