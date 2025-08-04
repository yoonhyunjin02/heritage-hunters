package org.hh.heritagehunters.domain.search.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/search")
public class SearchController {

  @GetMapping
  public String searchForm() {
    return "/features/search/search";
  }


}
