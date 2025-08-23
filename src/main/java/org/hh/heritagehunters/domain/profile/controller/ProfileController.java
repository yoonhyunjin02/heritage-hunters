package org.hh.heritagehunters.domain.profile.controller;

import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.profile.service.ProfileQueryService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

  private final ProfileQueryService profileQueryService;

  @GetMapping
  public String myProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
    if (customUserDetails == null) {
      return "redirect:/login";
    }
    return "redirect:/profile/" + customUserDetails.getId();
  }

  @GetMapping("/{userId}")
  public String view(@PathVariable Long userId,
      @AuthenticationPrincipal CustomUserDetails customUserDetails,
      Model model) {

    model.addAttribute("user", profileQueryService.getHeader(userId));
    model.addAttribute("stamps", profileQueryService.getStamps(userId));

    boolean isOwner = customUserDetails != null && customUserDetails.getId().equals(userId);
    model.addAttribute("isOwner", isOwner);

    // 목록 데이터는 SSR에서 제외
    model.addAttribute("initialPosts", Collections.emptyList());
    model.addAttribute("hasNextPosts", false);
    model.addAttribute("initialLiked", Collections.emptyList());
    model.addAttribute("hasNextLiked", false);

    return "features/profile/profile_page";
  }

}
