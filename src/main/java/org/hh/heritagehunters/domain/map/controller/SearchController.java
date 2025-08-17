package org.hh.heritagehunters.domain.map.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/map")
@RequiredArgsConstructor
@Validated
public class SearchController {

  private final SearchService searchService;

  // GET /map/search?q=경복궁&type=all&limit=20
  @GetMapping("/search")
  public ResponseEntity<List<MapMarkerDto>> search(
      @RequestParam(name = "q") String query,
      @RequestParam(name = "type", defaultValue = "all") String type,
      @RequestParam(name = "limit", defaultValue = "20")
      @Min(1) @Max(200) int limit // 1차적인 파라미터 밸리데이션(서비스에서도 한 번 더 방어)
  ) {
    if (query == null || query.isBlank()) {
      return ResponseEntity.badRequest().build();
    }
    // 서비스 쪽에서 최종 클램프와 정규화 수행
    List<MapMarkerDto> result = searchService.search(query, type, limit);
    return ResponseEntity.ok(result);
  }
}