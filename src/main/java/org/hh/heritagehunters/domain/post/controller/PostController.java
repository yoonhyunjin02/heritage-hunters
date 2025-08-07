package org.hh.heritagehunters.domain.post.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.post.dto.PostCreateRequest;
import org.hh.heritagehunters.domain.post.dto.PostCreateResponse;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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
      Model model) {

    log.debug("게시글 리스트 요청 - keyword: {}, region: {}, sort: {}, direction: {}, page: {}, size: {}", 
              keyword, region, sort, direction, page, size);

    // 게시글 조회 (예외는 PostService에서 처리하고 GlobalExceptionHandler로 전달)
    Page<Post> posts = postService.getPostsWithFilters(keyword, region, sort, direction, page, size);
    
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
    
    log.debug("게시글 리스트 조회 완료 - 총 {}개 게시글, {}페이지 중 {}페이지", 
              posts.getTotalElements(), posts.getTotalPages(), page + 1);
    
    return "features/post/post_list";
  }

  /**
   * 게시글 작성
   * @return
   */
  @PostMapping
  public String createPost(
      @AuthenticationPrincipal CustomUserDetails userDetails,
      @Valid @ModelAttribute PostCreateRequest request,
      BindingResult bindingResult,
      @RequestParam(value = "images", required = false) List<MultipartFile> images,
      RedirectAttributes redirectAttributes) {

    if (bindingResult.hasErrors()) {
      redirectAttributes.addFlashAttribute("toastType", "error");
      redirectAttributes.addFlashAttribute("toastMessage", "입력값을 확인해주세요.");
      return "redirect:/posts";
    }

    PostCreateResponse response = postService.createPost(userDetails.getUser(), request, images);

    redirectAttributes.addFlashAttribute("toastType", "success");
    redirectAttributes.addFlashAttribute("toastMessage", response.getMessage());
    if (response.getPointsEarned() > 0) {
      redirectAttributes.addFlashAttribute("pointsEarned", response.getPointsEarned());
    }

    return "redirect:/posts";
  }
}