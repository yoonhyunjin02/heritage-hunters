package org.hh.heritagehunters.common.exception;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler({
      DuplicateEmailException.class,
      DuplicateNicknameException.class,
      PasswordMismatchException.class
  })
  public String handleRegisterExceptions(RuntimeException e, Model model) {
    model.addAttribute("registerError", e.getMessage());
    return "features/oauth/register";
  }
}