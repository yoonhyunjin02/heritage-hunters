package org.hh.heritagehunters.domain.post.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.post.service.LikeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
public class LikeController {

  private final LikeService likeService;

  @PostMapping("/{id}/like")
  public String toggleLike(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      RedirectAttributes redirectAttributes) {

    requireAuthentication(currentUserDetails);
    boolean isLiked = likeService.toggle(postId, currentUserDetails.getUser());
    
    String message = isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다.";
    return redirectWithSuccess(redirectAttributes, message, "/posts/" + postId);
  }

  private void requireAuthentication(CustomUserDetails userDetails) {
    if (userDetails == null || userDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }
  }

  private String redirectWithToast(RedirectAttributes redirectAttributes, String type, String message, String path) {
    redirectAttributes.addFlashAttribute("toastType", type);
    redirectAttributes.addFlashAttribute("toastMessage", message);
    return "redirect:" + path;
  }

  private String redirectWithSuccess(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "success", message, path);
  }
}