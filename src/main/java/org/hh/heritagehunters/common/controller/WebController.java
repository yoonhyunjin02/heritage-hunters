package org.hh.heritagehunters.common.controller;

import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class WebController {

  @ModelAttribute("currentUser")
  public CustomUserDetails addCurrentUser(@AuthenticationPrincipal CustomUserDetails user) {
    return user;
  }
}