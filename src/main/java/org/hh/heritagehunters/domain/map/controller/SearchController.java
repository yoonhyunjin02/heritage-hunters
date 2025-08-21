package org.hh.heritagehunters.domain.map.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.handler.ApiExceptionHandler;
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
@Tag(name = "map-search-controller", description = "Map Search Controller")
public class SearchController {

  private final SearchService searchService;

  @Operation(
      summary = "문화유산 및 박물관 검색",
      description = "키워드로 문화유산 및 박물관을 검색합니다. limit은 1-200으로 제한됩니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "검색 결과 조회 성공"),
      @ApiResponse(responseCode = "400", description = "검색어가 비어있음 또는 잘못된 파라미터 (@Min/@Max 검증 실패 시 INVALID_INPUT_VALUE)",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class)))
  })
  @GetMapping("/search")
  public ResponseEntity<List<MapMarkerDto>> search(
      @Parameter(description = "검색 키워드", example = "경복궁", required = true)
      @RequestParam(name = "q") String query,
      @Parameter(description = "검색 타입 (all/heritage/museum)", example = "all")
      @RequestParam(name = "type", defaultValue = "all") String type,
      @Parameter(description = "조회 개수 제한 (1-200)", example = "20")
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