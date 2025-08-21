package org.hh.heritagehunters.domain.profile.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.handler.ApiExceptionHandler;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.application.PostFacade;
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
@Tag(name = "profile-api-controller", description = "Profile API Controller")
public class ProfileApiController {

  private final PostReader postReader;
  private final PostFacade postFacade;

  @Operation(
      summary = "사용자 게시글 조회",
      description = "특정 사용자가 작성한 게시글을 페이징하여 조회, 로그인한 사용자의 좋아요 상태도 포함"
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "게시글 목록 조회 성공"),
      @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class)))
  })
  @GetMapping("/posts")
  public Page<PostListResponseDto> userPosts(
      @Parameter(description = "조회할 사용자 ID", required = true, example = "1")
      @PathVariable Long userId,
      @Parameter(description = "페이지 번호", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "페이지 크기", example = "9")
      @RequestParam(defaultValue = "9") int size,
      @Parameter(hidden = true)
      @AuthenticationPrincipal CustomUserDetails principal) {
    User current = principal != null ? principal.getUser() : null;
    return postFacade.userPosts(userId, current, page, size);
  }

  @Operation(
      summary = "사용자가 좋아요한 게시글 조회",
      description = "특정 사용자가 좋아요를 누른 게시글을 페이징하여 조회합니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "좋아요한 게시글 목록 조회 성공"),
      @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class)))
  })
  @GetMapping("/likes")
  public Page<PostListResponseDto> likedPosts(
      @Parameter(description = "조회할 사용자 ID", required = true, example = "1")
      @PathVariable Long userId,
      @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
      @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "페이지 크기", example = "9")
      @RequestParam(defaultValue = "9") int size,
      @Parameter(hidden = true)
      @AuthenticationPrincipal CustomUserDetails principal) {
    User current = principal != null ? principal.getUser() : null;
    return postFacade.likedPosts(userId, current, page, size);
  }
}
