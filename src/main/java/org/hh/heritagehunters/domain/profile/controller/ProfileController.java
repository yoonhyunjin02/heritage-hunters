package org.hh.heritagehunters.domain.profile.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileController {

  @GetMapping("/profile")
  public String showProfilePage() {
    return "features/profile/profile"; // templates/features/main/main.html
  }
}