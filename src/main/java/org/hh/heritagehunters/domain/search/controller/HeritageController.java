package org.hh.heritagehunters.domain.search.controller;

import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/api/heritages")
public class HeritageController {

  @GetMapping
  public ResponseEntity<?> getHeritages(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(required = false) String designation,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String region,
      @RequestParam(required = false) String keyword
  ) {

    return ResponseEntity.ok();
  }

  @GetMapping("/{id}")
  public ResponseEntity<Heritage> getHeritageDetail(Model model) {

    return ResponseEntity.ok();
  }
}
