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
  private final PostReader postReader;
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

  // 프로필 상세 게시물 조회 (모달 열기)
  @GetMapping("/posts/{postId}")
  public PostDetailResponseDto getProfilePostDetail(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails) {

    User currentUser = currentUserDetails != null ? currentUserDetails.getUser() : null;
    return postFacade.detail(postId, currentUser);
  }

  // 게시글 수정
  @PutMapping("/posts/{postId}")
  public ResponseEntity<PostDetailResponseDto> updatePost(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute PostUpdateRequestDto requestDto,
      @RequestParam(value = "images", required = false) List<MultipartFile> newImages,
      @RequestParam(value = "keepImages", required = false) List<Long> keepImageIds) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    postFacade.update(postId, currentUserDetails.getUser(), requestDto, newImages, keepImageIds);
    return ResponseEntity.ok(postFacade.detail(postId, currentUserDetails.getUser()));
  }

  // 댓글 작성
  @PostMapping("/posts/{postId}/comments")
  public ResponseEntity<List<CommentResponseDto>> createComment(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @RequestBody CommentCreateRequestDto requestDto) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    postFacade.addComment(postId, currentUserDetails.getUser(), requestDto);

    // 전체 댓글 리스트 반환 → 프론트에서 갱신 가능
    return ResponseEntity.ok(postReader.loadComments(postId).stream().map(CommentResponseDto::from).toList());
  }

  // 좋아요 토글
  @PostMapping("/posts/{postId}/like")
  public ResponseEntity<LikeResponseDto> toggleLike(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    boolean isLiked = postFacade.toggleLike(postId, currentUserDetails.getUser());
    int likeCount = postReader.getById(postId).getLikeCount();

    return ResponseEntity.ok(new LikeResponseDto(isLiked, likeCount));
  }

  // 게시글 삭제
  @DeleteMapping("/posts/{postId}")
  public ResponseEntity<Void> deletePost(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    postFacade.delete(postId, currentUserDetails.getUser());
    return ResponseEntity.noContent().build(); // 204 반환
  }

}
