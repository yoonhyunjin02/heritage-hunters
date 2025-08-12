package org.hh.heritagehunters.domain.search.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.search.dto.HeritageResponse;
import org.hh.heritagehunters.domain.search.dto.HeritageSearchRequest;
import org.hh.heritagehunters.domain.search.service.HeritageService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/heritages")
@RequiredArgsConstructor
public class HeritageController {

  private final HeritageService service;

//  @GetMapping
//  public ResponseEntity<Page<HeritageResponse>> getHeritages(
//      HeritageSearchRequest request
//  ) {
//    Page<HeritageResponse> result = service.search(request);
//    return ResponseEntity.ok(result);
//  }
//
//  @GetMapping("/{id}")
//  public ResponseEntity<HeritageResponse> getHeritageDetail(
//      @PathVariable Long id
//  ) {
//    HeritageResponse detail = service.getDetail(id);
//    return ResponseEntity.ok(detail);
//  }
}
