package org.hh.heritagehunters.domain.profile.controller;

import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.service.PostReader;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/{userId}")
public class ProfileApiController {
  private final PostReader postReader;
  private final PostFacade postFacade;

  @GetMapping("/posts")
  public Page<PostListResponseDto> userPosts(@PathVariable Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "30") int size,
      @AuthenticationPrincipal CustomUserDetails principal) {
    Page<Post> posts = postReader.getUserPosts(userId, page, size);
    User current = principal != null ? principal.getUser() : null;

    // 배치 최적화(선호):
    Set<Long> likedIds = (current == null) ? Set.of() : postReader.findLikedPostIds(current.getId(), posts.getContent());
    return posts.map(p -> PostListResponseDto.from(p, likedIds.contains(p.getId())));
  }

  @GetMapping("/likes")
  public Page<PostListResponseDto> likedPosts(@PathVariable Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "30") int size,
      @AuthenticationPrincipal CustomUserDetails principal) {
    Page<Post> posts = postReader.getLikedPosts(userId, page, size);
    User current = principal != null ? principal.getUser() : null;

    Set<Long> likedIds = (current == null) ? Set.of() : postReader.findLikedPostIds(current.getId(), posts.getContent());
    return posts.map(p -> PostListResponseDto.from(p, likedIds.contains(p.getId())));
  }
}
