package org.hh.heritagehunters.domain.profile.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.service.PostReader;
import org.hh.heritagehunters.domain.profile.dto.CommentResponseDto;
import org.hh.heritagehunters.domain.profile.dto.LikeResponseDto;
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
@RequestMapping("/profile/{userId}/posts/{postId}")
public class ProfileModalApiController {

  private final PostFacade postFacade;
  private final PostReader postReader;

  // 프로필 상세 게시물 조회 (모달 열기)
  @GetMapping
  public PostDetailResponseDto getProfilePostDetail(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails) {

    User currentUser = currentUserDetails != null ? currentUserDetails.getUser() : null;
    return postFacade.detail(postId, currentUser);
  }

  // 게시글 수정
  @PutMapping
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
  @PostMapping("/comments")
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
  @PostMapping("/like")
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
  @DeleteMapping
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
