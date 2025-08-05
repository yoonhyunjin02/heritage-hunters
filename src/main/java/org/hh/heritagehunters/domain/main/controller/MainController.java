package org.hh.heritagehunters.domain.main.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

  @GetMapping("/main")
  public String showMainPage() {
    return "features/main/main"; // templates/features/main/main.html
  }
}