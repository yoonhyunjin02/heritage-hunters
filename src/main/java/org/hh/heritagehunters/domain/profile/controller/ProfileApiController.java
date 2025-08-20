package org.hh.heritagehunters.domain.profile.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.service.UserFacade;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.hh.heritagehunters.domain.post.service.PostReader;
import org.hh.heritagehunters.domain.profile.dto.CommentResponseDto;
import org.hh.heritagehunters.domain.profile.dto.LikeResponseDto;
import org.hh.heritagehunters.domain.profile.dto.ProfileResponseDto;
import org.hh.heritagehunters.domain.profile.dto.ProfileUpdateRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/profile/{userId}")
public class ProfileApiController {

  private final PostFacade postFacade;
  private final UserFacade userFacade; // 프로필 수정용

  // 내 게시글 목록 조회
  @GetMapping("/posts")
  public Page<PostListResponseDto> userPosts(
      @PathVariable Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "9") int size,
      @AuthenticationPrincipal CustomUserDetails principal) {
    User current = principal != null ? principal.getUser() : null;
    return postFacade.userPosts(userId, current, page, size);
  }

  // 내가 좋아요 누른 글 목록 조회
  @GetMapping("/likes")
  public Page<PostListResponseDto> likedPosts(
      @PathVariable Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "9") int size,
      @AuthenticationPrincipal CustomUserDetails principal) {
    User current = principal != null ? principal.getUser() : null;
    return postFacade.likedPosts(userId, current, page, size);
  }

  // 프로필 정보 수정 (프로필사진, 닉네임, 한줄소개)
  @PutMapping
  public ResponseEntity<ProfileResponseDto> updateProfile(
      @PathVariable Long userId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute ProfileUpdateRequestDto requestDto,
      @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    User updated = userFacade.updateProfile(userId, currentUserDetails.getUser(), requestDto, profileImage);
    return ResponseEntity.ok(ProfileResponseDto.from(updated));
  }


}
