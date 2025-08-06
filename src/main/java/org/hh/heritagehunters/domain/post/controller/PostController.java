package org.hh.heritagehunters.domain.post.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.domain.post.service.PostService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
@Slf4j
public class PostController {

  private final PostService postService;

  @GetMapping("/new")
  public String createPostForm() {
    // 게시글 작성 폼으로 이동
    return "post_write";
  }

  @GetMapping
  public String getPosts() {
    return "features/post/post_list";
  }
}
