package org.hh.heritagehunters.domain.post.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.domain.post.entity.Post;
import org.hh.heritagehunters.domain.post.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

  private final PostService postService;

  @GetMapping("/new")
  public String createPostForm() {
    return "feature/post/post_list";
  }

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

    try {
      // 게시글 조회
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

    } catch (Exception e) {
      log.error("게시글 리스트 조회 중 오류 발생", e);
      model.addAttribute("error", "게시글을 불러오는 중 오류가 발생했습니다.");
    }
    
    return "features/post/post_list";
  }
}
