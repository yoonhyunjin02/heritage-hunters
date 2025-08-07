package org.hh.heritagehunters.common.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.service.CustomUserDetailsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
@RequiredArgsConstructor
public class CurrentUserAdvice  {

  private final CustomUserDetailsService customUserDetailsService;

  @ModelAttribute("currentUser")
  public CustomUserDetails addCurrentUser(@AuthenticationPrincipal Object principal) {
    if (principal instanceof CustomUserDetails user) {
      return user; // 로컬 로그인 사용자
    }

    if (principal instanceof OAuth2User oauth2User) {
      String email = oauth2User.getAttribute("email");
      if (email == null) return null;

      // 이메일로 CustomUserDetails 조회
      return (CustomUserDetails) customUserDetailsService.loadUserByUsername(email);
    }

    return null;
  }

  // 4가지 랜덤 기본 프로필 이미지 제공
  @ModelAttribute("defaultProfileImage")
  public String defaultProfileImage() {
    int randomIndex = (int) (Math.random() * 4) + 1; // 1~4
    return "/images/profile/profile" + randomIndex + ".png";
  }
}