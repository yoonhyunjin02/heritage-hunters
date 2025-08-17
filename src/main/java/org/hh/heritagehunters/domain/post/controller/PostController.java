package org.hh.heritagehunters.domain.post.controller;

import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
   * 게시글 목록을 조회하고 페이지네이션된 결과를 반환합니다
   * @param keyword 검색 키워드 (선택사항)
   * @param region 지역 필터 (선택사항)
   * @param sort 정렬 기준 (기본값: createdAt)
   * @param direction 정렬 방향 (기본값: desc)
   * @param page 페이지 번호 (기본값: 0)
   * @param size 페이지 크기 (기본값: 16)
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param model 뷰에 전달할 데이터 모델
   * @return 게시글 목록 페이지 뷰 이름
   */
  @GetMapping
  public String getPosts(
      @RequestParam(value = "keyword", required = false) String keyword,
      @RequestParam(value = "region", required = false) String region,
      @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
      @RequestParam(value = "direction", defaultValue = "desc") String direction,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "16") int size,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      Model model) {

    User currentUser = (currentUserDetails != null) ? currentUserDetails.getUser() : null;
    model.addAttribute("currentUser", currentUserDetails);

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

    // 페이지 번호 10개씩 그룹핑
    int totalPages = posts.getTotalPages();
    int groupSize = 10;
    int start = (page / groupSize) * groupSize + 1;
    int end = Math.min(start + groupSize - 1, Math.max(totalPages, 10));

    List<Integer> pageNumbers = java.util.stream.IntStream.rangeClosed(start, end)
        .boxed()
        .collect(java.util.stream.Collectors.toList());

    model.addAttribute("pageNumbers", pageNumbers);

    return "features/post/post_list";
  }

  /**
   * 새로운 게시글을 작성합니다
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param request 게시글 작성 요청 데이터
   * @param bindingResult 유효성 검증 결과
   * @param images 업로드할 이미지 파일 목록
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @return 리다이렉트 URL
   */
  @PostMapping
  public String createPost(
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute PostCreateRequestDto request,
      BindingResult bindingResult,
      @RequestParam(value = "images") List<MultipartFile> images,
      RedirectAttributes redirectAttributes) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "입력값을 확인해주세요.", "/posts");
    }

    PostCreateResponseDto response = postFacade.create(currentUserDetails.getUser(), request, images);

    if (response.getPointsEarned() > 0) {
      redirectAttributes.addFlashAttribute("pointsEarned", response.getPointsEarned());
    }

    return redirectWithSuccess(redirectAttributes, response.getMessage(), "/posts");
  }

  /**
   * 게시글 수정 폼을 조회합니다
   * @param postId 수정할 게시글 ID
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param model 뷰에 전달할 데이터 모델
   * @return 게시글 수정 페이지 뷰 이름
   */
  @GetMapping("/{id}/edit")
  public String getEditForm(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      Model model) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    PostDetailResponseDto post = postFacade.forEdit(postId, currentUserDetails.getUser());

    PostUpdateRequestDto updateForm = new PostUpdateRequestDto();
    updateForm.setContent(post.getContent());
    updateForm.setLocation(post.getLocation());

    model.addAttribute("post", post);
    model.addAttribute("updateForm", updateForm);

    return "features/post/post_edit";
  }

  /**
   * 게시글을 수정합니다
   * @param postId 수정할 게시글 ID
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param postUpdateRequestDto 게시글 수정 요청 데이터
   * @param bindingResult 유효성 검증 결과
   * @param newImages 새로 업로드할 이미지 파일 목록
   * @param keepImageIds 유지할 기존 이미지 ID 목록
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @return 리다이렉트 URL
   */
  @PutMapping("/{id}")
  public String updatePost(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute PostUpdateRequestDto postUpdateRequestDto,
      BindingResult bindingResult,
      @RequestParam(value = "images", required = false) List<MultipartFile> newImages,
      @RequestParam(value = "keepImages", required = false) List<Long> keepImageIds,
      @RequestParam(value = "removedImages", required = false) String removedImageIds,
      RedirectAttributes redirectAttributes,
      HttpServletRequest request) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "입력값을 확인해주세요.", "/posts/" + postId);
    }

    postFacade.update(postId, currentUserDetails.getUser(), postUpdateRequestDto, newImages, keepImageIds);

    // AJAX 요청인 경우 게시글 리스트로 리다이렉트 (모달에서 처리)
    if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
      return "redirect:/posts";
    }

    return redirectWithSuccess(redirectAttributes, "게시글이 수정되었습니다.", "/posts/" + postId);
  }


  /**
   * 게시글 상세 정보를 조회합니다
   * @param postId 조회할 게시글 ID
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param model 뷰에 전달할 데이터 모델
   * @return 게시글 상세 페이지 뷰 이름
   */
  @GetMapping("/{id}")
  public String getPostDetail(@PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      Model model) {

    User currentUser = (currentUserDetails != null) ? currentUserDetails.getUser() : null;

    PostDetailResponseDto post = postFacade.detail(postId, currentUser);

    model.addAttribute("post", post);
    model.addAttribute("currentUser", currentUser);
    model.addAttribute("commentForm", new CommentCreateRequestDto());

    return "features/post/post_detail";
  }

  /**
   * 게시글에 댓글을 작성합니다
   * @param postId 댓글을 작성할 게시글 ID
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param commentForm 댓글 작성 요청 데이터
   * @param bindingResult 유효성 검증 결과
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @return 리다이렉트 URL
   */
  @PostMapping("/{postId}/comments")
  public String createComment(
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute CommentCreateRequestDto commentForm,
      BindingResult bindingResult,
      RedirectAttributes redirectAttributes,
      HttpServletRequest request) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    if (bindingResult.hasErrors()) {
      // AJAX 요청인 경우 상태 코드로 에러 전달
      if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
        throw new BadRequestException(ErrorCode.INVALID_INPUT_VALUE);
      }
      return redirectWithError(redirectAttributes, "댓글 내용을 입력해주세요.", "/posts");
    }

    // 댓글 작성 및 카운트
    postFacade.addComment(postId, currentUserDetails.getUser(), commentForm);

    // AJAX 요청인 경우 성공 응답
    if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
      return "redirect:/posts/" + postId;
    }

    return redirectWithSuccess(redirectAttributes, "댓글이 등록되었습니다.", "/posts");
  }

  /**
   * 게시글 좋아요를 토글합니다
   * @param postId 좋아요를 토글할 게시글 ID
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @return 리다이렉트 URL
   */
  @PostMapping("/{id}/like")
  public String toggleLike(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      RedirectAttributes redirectAttributes) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    boolean isLiked = postFacade.toggleLike(postId, currentUserDetails.getUser());

    String message = isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다.";
    return redirectWithSuccess(redirectAttributes, message, "/posts/" + postId);
  }

  /**
   * 게시글을 삭제합니다
   * @param postId 삭제할 게시글 ID
   * @param currentUserDetails 현재 로그인한 사용자 정보
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @return 리다이렉트 URL
   */
  @DeleteMapping("/{id}")
  public String deletePost(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      RedirectAttributes redirectAttributes) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    // 작성자 검증 + 삭제
    postFacade.delete(postId, currentUserDetails.getUser());

    return redirectWithSuccess(redirectAttributes, "게시글이 삭제되었습니다.", "/posts");
  }

  // ================= 헬퍼 메서드들 =================

  /**
   * 토스트 메시지와 함께 리다이렉트합니다
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @param type 토스트 메시지 타입
   * @param message 토스트 메시지 내용
   * @param path 리다이렉트할 경로
   * @return 리다이렉트 URL
   */
  private String redirectWithToast(RedirectAttributes redirectAttributes, String type, String message, String path) {
    redirectAttributes.addFlashAttribute("toastType", type);
    redirectAttributes.addFlashAttribute("toastMessage", message);
    return "redirect:" + path;
  }

  /**
   * 성공 메시지와 함께 리다이렉트합니다
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @param message 성공 메시지
   * @param path 리다이렉트할 경로
   * @return 리다이렉트 URL
   */
  private String redirectWithSuccess(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "success", message, path);
  }

  /**
   * 에러 메시지와 함께 리다이렉트합니다
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @param message 에러 메시지
   * @param path 리다이렉트할 경로
   * @return 리다이렉트 URL
   */
  private String redirectWithError(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "error", message, path);
  }
}