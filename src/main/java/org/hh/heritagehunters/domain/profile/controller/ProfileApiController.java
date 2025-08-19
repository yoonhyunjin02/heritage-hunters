package org.hh.heritagehunters.domain.profile.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.service.PostReader;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/profile/{userId}")
public class ProfileApiController {

  private final PostReader postReader;
  private final PostFacade postFacade;

  @GetMapping("/posts")
  public Page<PostListResponseDto> userPosts(
      @PathVariable Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "9") int size,
      @AuthenticationPrincipal CustomUserDetails principal) {
    User current = principal != null ? principal.getUser() : null;
    return postFacade.userPosts(userId, current, page, size);
  }

  @GetMapping("/likes")
  public Page<PostListResponseDto> likedPosts(
      @PathVariable Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "9") int size,
      @AuthenticationPrincipal CustomUserDetails principal) {
    User current = principal != null ? principal.getUser() : null;
    return postFacade.likedPosts(userId, current, page, size);
  }

  /**
   * 프로필에서 게시물 모달 호출용 엔드포인트
   */
  @GetMapping("/posts/{postId}")
  public PostDetailResponseDto getProfilePostDetail(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails) {

    User currentUser = currentUserDetails != null ? currentUserDetails.getUser() : null;
    return postFacade.detail(postId, currentUser);
  }

}
