package org.hh.heritagehunters.domain.post.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.application.PostFacade;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.request.PostUpdateRequestDto;
import org.hh.heritagehunters.domain.post.dto.response.PostCreateResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostDetailResponseDto;
import org.hh.heritagehunters.domain.post.dto.response.PostListResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

  private final PostFacade postFacade;

  /**
   * 게시글 리스트
   */
  @GetMapping
  public String getPosts(
      @RequestParam(value = "keyword", required = false) String keyword,
      @RequestParam(value = "region", required = false) String region,
      @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
      @RequestParam(value = "direction", defaultValue = "desc") String direction,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "16") int size,
      @AuthenticationPrincipal CustomUserDetails customUserDetails,
      Model model) {

    User currentUser = (customUserDetails != null) ? customUserDetails.getUser() : null;

    log.debug("게시글 리스트 요청 - keyword: {}, region: {}, sort: {}, direction: {}, page: {}, size: {}",
        keyword, region, sort, direction, page, size);

    // 로그인 여부와 무관하게 목록 조회 (익명 사용자도 OK, 좋아요표시는 파사드가 처리)
    Page<PostListResponseDto> posts = postFacade.list(
        currentUser, keyword, region, sort, direction, page, size
    );

    model.addAttribute("posts", posts);
    model.addAttribute("keyword", keyword);
    model.addAttribute("region", region);
    model.addAttribute("sort", sort);
    model.addAttribute("direction", direction);
    model.addAttribute("currentPage", page);
    model.addAttribute("totalPages", posts.getTotalPages());
    model.addAttribute("totalElements", posts.getTotalElements());

    return "features/post/post_list";
  }

  /**
   * 게시글 작성
   */
  @PostMapping
  public String createPost(
      @AuthenticationPrincipal CustomUserDetails userDetails,
      @Valid @ModelAttribute PostCreateRequestDto request,
      BindingResult bindingResult,
      @RequestParam(value = "images") List<MultipartFile> images,
      RedirectAttributes redirectAttributes) {


    if (userDetails == null || userDetails.getUser() == null) {
      return redirectWithError(redirectAttributes, "로그인 후 게시글을 작성할 수 있습니다.", "/login");
    }

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "입력값을 확인해주세요.", "/posts");
    }

    PostCreateResponseDto response = postFacade.create(userDetails.getUser(), request, images);

    if (response.getPointsEarned() > 0) {
      redirectAttributes.addFlashAttribute("pointsEarned", response.getPointsEarned());
    }

    return redirectWithSuccess(redirectAttributes, response.getMessage(), "/posts");
  }

  /**
   * 게시글 수정 폼
   */
  @GetMapping("/{id}/edit")
  public String getEditForm(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      Model model) {

    if (userDetails == null || userDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    PostDetailResponseDto post = postFacade.forEdit(postId, userDetails.getUser());

    PostUpdateRequestDto updateForm = new PostUpdateRequestDto();
    updateForm.setContent(post.getContent());
    updateForm.setLocation(post.getLocation());

    model.addAttribute("post", post);
    model.addAttribute("updateForm", updateForm);

    return "features/post/post_edit";
  }

  /**
   * 게시글 수정 처리
   */
  @PutMapping("/{id}")
  public String updatePost(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      @Valid @ModelAttribute PostUpdateRequestDto postUpdateRequestDto,
      BindingResult bindingResult,
      @RequestParam(value = "images", required = false) List<MultipartFile> newImages,
      @RequestParam(value = "keepImages", required = false) List<Long> keepImageIds,
      RedirectAttributes redirectAttributes) {

    if (userDetails == null || userDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "입력값을 확인해주세요.", "/posts/" + postId);
    }

    postFacade.update(postId, userDetails.getUser(), postUpdateRequestDto, newImages, keepImageIds);

    return redirectWithSuccess(redirectAttributes, "게시글이 수정되었습니다.", "/posts/" + postId);
  }


  /**
   * 게시글 상세
   */
  @GetMapping("/{id}")
  public String getPostDetail(@PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      Model model) {

    User currentUser = (userDetails != null) ? userDetails.getUser() : null;

    PostDetailResponseDto post = postFacade.detail(postId, currentUser);

    model.addAttribute("post", post);
    model.addAttribute("currentUser", currentUser);
    model.addAttribute("commentForm", new CommentCreateRequestDto());

    return "features/post/post_detail";
  }

  /**
   * 게시글 상세 모달 프래그먼트 반환
   */
  @GetMapping("/{id}/fragment")
  public String getPostDetailFragment(@PathVariable Long id,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      Model model) {
    User currentUser = userDetails != null ? userDetails.getUser() : null;
    PostDetailResponseDto post = postFacade.detail(id, currentUser);

    model.addAttribute("post", post);
    model.addAttribute("currentUser", currentUser);
    model.addAttribute("commentForm", new CommentCreateRequestDto());

    return "features/post/post_detail_fragment";
  }

  /**
   * 댓글 작성
   */
  @PostMapping("/{postId}/comments")
  public String createComment(
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      @Valid @ModelAttribute CommentCreateRequestDto commentForm,
      BindingResult bindingResult,
      RedirectAttributes redirectAttributes) {

    if (userDetails == null || userDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "댓글 내용을 입력해주세요.", "/posts/" + postId);
    }

    // 댓글 작성 및 카운트
    postFacade.addComment(postId, userDetails.getUser(), commentForm);

    return redirectWithSuccess(redirectAttributes, "댓글이 등록되었습니다.", "/posts/" + postId);
  }

  /**
   * 좋아요 토글
   */
  @PostMapping("/{id}/like")
  public String toggleLike(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      RedirectAttributes redirectAttributes) {

    if (userDetails == null || userDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    boolean isLiked = postFacade.toggleLike(postId, userDetails.getUser());

    String message = isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다.";
    return redirectWithSuccess(redirectAttributes, message, "/posts/" + postId);
  }

  /**
   * 게시글 삭제
   */
  @DeleteMapping("/{id}")
  public String deletePost(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails userDetails,
      RedirectAttributes redirectAttributes) {

    if (userDetails == null || userDetails.getUser() == null) {
      throw new BadRequestException(ErrorCode.LOGIN_REQUIRED);
    }

    // 작성자 검증 + 삭제
    postFacade.delete(postId, userDetails.getUser());

    return redirectWithSuccess(redirectAttributes, "게시글이 삭제되었습니다.", "/posts");
  }

  // ================= 헬퍼 메서드들 =================

  /**
   * 토스트 메시지와 함께 리다이렉트
   * 사용자 경험을 고려한 적절한 페이지로 이동
   */
  private String redirectWithToast(RedirectAttributes redirectAttributes, String type, String message, String path) {
    redirectAttributes.addFlashAttribute("toastType", type);
    redirectAttributes.addFlashAttribute("toastMessage", message);
    return "redirect:" + path;
  }

  /**
   * 성공 메시지와 함께 리다이렉트
   */
  private String redirectWithSuccess(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "success", message, path);
  }

  /**
   * 에러 메시지와 함께 리다이렉트
   */
  private String redirectWithError(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "error", message, path);
  }
}