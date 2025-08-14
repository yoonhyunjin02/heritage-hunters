package org.hh.heritagehunters.domain.profile.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.profile.service.ProfileQueryService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

  private final ProfileQueryService profileQueryService;

  @GetMapping("/{userId}")
  public String view(@PathVariable Long userId, Model model) {
    model.addAttribute("user", profileQueryService.getHeader(userId));
    model.addAttribute("stamps", profileQueryService.getStamps(userId));
    // 게시물 목록은 API로 무한 스크롤 호출
    return "features/profile/profile_page";
  }
}
