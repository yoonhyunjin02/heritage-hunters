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
import org.hh.heritagehunters.domain.post.dto.request.PostContentUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.service.PostReader;
import org.hh.heritagehunters.domain.post.dto.response.CommentResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.LikeResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

  // 게시글 수정 (본문 텍스트만 수정 가능)
  @PatchMapping
  public ResponseEntity<PostDetailResponseDto> updatePostContent(
      @PathVariable Long userId,
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @RequestBody PostContentUpdateRequestDto requestDto) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }
    // 소유자 검증 (경로 userId와 인증 사용자 일치)
    if (!currentUserDetails.getUser().getId().equals(userId)) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }

    postFacade.updateContentOnly(postId, currentUserDetails.getUser(), requestDto.getContent());
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
    return ResponseEntity.ok(
        postReader.loadComments(postId).stream().map(CommentResponseDto::from).toList()
    );
  }

  // 좋아요 토글 (소유자 조건 없음)
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
    if (!currentUserDetails.getUser().getId().equals(userId)) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }

    postFacade.delete(postId, currentUserDetails.getUser());
    return ResponseEntity.noContent().build();
  }
}