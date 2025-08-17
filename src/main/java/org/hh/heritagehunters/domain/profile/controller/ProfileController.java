package org.hh.heritagehunters.domain.profile.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.profile.service.ProfileQueryService;
import org.springframework.data.domain.Page;
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
  private final PostFacade postFacade;

  @GetMapping
  public String myProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails) {
    if (customUserDetails == null) {
      // 로그인 안 했으면 로그인 페이지로
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

    // 내가 올린 게시물 첫 페이지
    Page<PostListResponseDto> firstPosts = postFacade.userPosts(
        userId,
        customUserDetails != null ? customUserDetails.getUser() : null,
        0, 9
    );
    model.addAttribute("initialPosts", firstPosts.getContent());
    model.addAttribute("hasNextPosts", firstPosts.hasNext());

    // '좋아요' 누른 게시물 첫 페이지
    Page<PostListResponseDto> firstLiked = postFacade.likedPosts(
        userId,
        customUserDetails != null ? customUserDetails.getUser() : null,
        0, 9
    );
    model.addAttribute("initialLiked", firstLiked.getContent());
    model.addAttribute("hasNextLiked", firstLiked.hasNext());

    log.info("hasNextPosts={}", firstPosts.hasNext());
    log.info("hasNextLiked={}", firstLiked.hasNext());


    return "features/profile/profile_page";
  }

}
