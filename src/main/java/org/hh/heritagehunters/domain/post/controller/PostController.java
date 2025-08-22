package org.hh.heritagehunters.domain.post.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    User currentUser = extractUser(currentUserDetails);
    model.addAttribute("currentUser", currentUserDetails);
    Page<PostListResponseDto> posts = postFacade.list(
        currentUser, keyword, region, sort, direction, page, size
    );

    model.addAttribute("posts", posts);
    model.addAttribute("keyword", keyword);
    model.addAttribute("region", region != null ? region : "");
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

  @PostMapping
  public String createPost(
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute PostCreateRequestDto request,
      BindingResult bindingResult,
      @RequestParam(value = "images") List<MultipartFile> images,
      RedirectAttributes redirectAttributes) {

    requireAuthentication(currentUserDetails);

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "입력값을 확인해주세요.", "/posts");
    }

    PostCreateResponseDto response = postFacade.create(currentUserDetails.getUser(), request, images);

    if (response.getPointsEarned() > 0) {
      redirectAttributes.addFlashAttribute("pointsEarned", response.getPointsEarned());
    }

    return redirectWithSuccess(redirectAttributes, response.getMessage(), "/posts");
  }

  @GetMapping("/{id}/edit")
  public String getEditForm(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      Model model) {

    requireAuthentication(currentUserDetails);

    PostDetailResponseDto post = postFacade.forEdit(postId, currentUserDetails.getUser());

    PostUpdateRequestDto updateForm = new PostUpdateRequestDto();
    updateForm.setContent(post.getContent());
    updateForm.setLocation(post.getLocation());

    model.addAttribute("post", post);
    model.addAttribute("updateForm", updateForm);

    return "features/post/post_edit";
  }

  @PutMapping("/{id}")
  public String updatePost(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute PostUpdateRequestDto postUpdateRequestDto,
      BindingResult bindingResult,
      @RequestParam(value = "images", required = false) List<MultipartFile> newImages,
      @RequestParam(value = "keepImages", required = false) List<Long> keepImageIds,
      RedirectAttributes redirectAttributes,
      HttpServletRequest request) {

    requireAuthentication(currentUserDetails);

    if (bindingResult.hasErrors()) {
      return redirectWithError(redirectAttributes, "입력값을 확인해주세요.", "/posts/" + postId);
    }

    postFacade.update(postId, currentUserDetails.getUser(), postUpdateRequestDto, newImages, keepImageIds);

    if (isAjaxRequest(request)) {
      return "features/post/empty";
    }

    return redirectWithSuccess(redirectAttributes, "게시글이 수정되었습니다.", "/posts/" + postId);
  }

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

  @DeleteMapping("/{id}")
  public String deletePost(
      @PathVariable("id") Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      RedirectAttributes redirectAttributes) {

    requireAuthentication(currentUserDetails);

    // 작성자 검증 + 삭제
    postFacade.delete(postId, currentUserDetails.getUser());

    return redirectWithSuccess(redirectAttributes, "게시글이 삭제되었습니다.", "/posts");
  }

  // ================= 헬퍼 메서드들 =================

  private User extractUser(CustomUserDetails userDetails) {
    return userDetails != null ? userDetails.getUser() : null;
  }

  private void requireAuthentication(CustomUserDetails userDetails) {
    if (userDetails == null || userDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }
  }

  private boolean isAjaxRequest(HttpServletRequest request) {
    return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
  }
  private String redirectWithToast(RedirectAttributes redirectAttributes, String type, String message, String path) {
    redirectAttributes.addFlashAttribute("toastType", type);
    redirectAttributes.addFlashAttribute("toastMessage", message);
    return "redirect:" + path;
  }

  private String redirectWithSuccess(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "success", message, path);
  }

  private String redirectWithError(RedirectAttributes redirectAttributes, String message, String path) {
    return redirectWithToast(redirectAttributes, "error", message, path);
  }
}