package org.hh.heritagehunters.domain.search.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.search.dto.HeritageResponse;
import org.hh.heritagehunters.domain.search.service.HeritageService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/heritage")
@RequiredArgsConstructor
public class HeritageViewController {

  private final HeritageService heritageService;

  /**
   * 유산 상세 페이지 렌더링
   */
//  @GetMapping("/{id}")
//  public String getHeritageDetail(@PathVariable Long id, Model model) {
//    HeritageResponse detail = heritageService.getDetail(id);
//    model.addAttribute("heritage", detail);
//    return "/features/search/heritage_detail";
//  }
}