package org.hh.heritagehunters.domain.post.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.post.dto.PostCreateRequestDto;
import org.hh.heritagehunters.domain.post.dto.PostCreateResponseDto;
import org.hh.heritagehunters.domain.post.dto.PostListResponseDto;
import org.hh.heritagehunters.domain.post.service.PostService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

  private final PostService postService;

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

    log.debug("게시글 리스트 요청 - keyword: {}, region: {}, sort: {}, direction: {}, page: {}, size: {}",
        keyword, region, sort, direction, page, size);

    User currentUser = customUserDetails.getUser();
    if (currentUser != null) {
      Page<PostListResponseDto> posts = postService.getPostResponses(
          currentUser, keyword, region, sort, direction, page, size
      );

      // 모델에 데이터 추가
      model.addAttribute("posts", posts);
      model.addAttribute("keyword", keyword);
      model.addAttribute("region", region);
      model.addAttribute("sort", sort);
      model.addAttribute("direction", direction);

      // 현재 필터 정보
      model.addAttribute("currentPage", page);
      model.addAttribute("totalPages", posts.getTotalPages());
      model.addAttribute("totalElements", posts.getTotalElements());
    }

    return "features/post/post_list";
  }

  /**
   * 게시글 작성
   *
   * @return
   */
  @PostMapping
  public String createPost(
      @AuthenticationPrincipal CustomUserDetails userDetails,
      @Valid @ModelAttribute PostCreateRequestDto request,
      BindingResult bindingResult,
      @RequestParam(value = "images") List<MultipartFile> images,
      RedirectAttributes redirectAttributes) {

    if (userDetails == null || userDetails.getUser() == null) {
      redirectAttributes.addFlashAttribute("toastType", "error");
      redirectAttributes.addFlashAttribute("toastMessage", "로그인 후 게시글을 작성할 수 있습니다.");
      return "redirect:/login";
    }

    if (bindingResult.hasErrors()) {
      redirectAttributes.addFlashAttribute("toastType", "error");
      redirectAttributes.addFlashAttribute("toastMessage", "입력값을 확인해주세요.");
      return "redirect:/posts";
    }

    PostCreateResponseDto response = postService.createPost(userDetails.getUser(), request, images);

    redirectAttributes.addFlashAttribute("toastType", "success");
    redirectAttributes.addFlashAttribute("toastMessage", response.getMessage());
    if (response.getPointsEarned() > 0) {
      redirectAttributes.addFlashAttribute("pointsEarned", response.getPointsEarned());
    }

    return "redirect:/posts";
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

    postService.deletePost(postId, userDetails.getUser());

    redirectAttributes.addFlashAttribute("toastType", "success");
    redirectAttributes.addFlashAttribute("toastMessage", "게시글이 삭제되었습니다.");

    return "redirect:/posts";
  }
}