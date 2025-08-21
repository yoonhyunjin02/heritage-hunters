package org.hh.heritagehunters.domain.map.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.handler.ApiExceptionHandler;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.ViewportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/map")
@RequiredArgsConstructor
@Tag(name = "map-viewport-controller", description = "Map Viewport Controller")
public class ViewportController {

  private final ViewportService service;

  @Operation(
      summary = "지도 영역 내 마커 조회",
      description = "지정된 bounding box 영역 내의 문화유산 및 박물관 마커를 조회합니다. limit은 1-2000으로 제한됩니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "마커 목록 조회 성공"),
      @ApiResponse(responseCode = "400", description = "잘못된 bbox 형식",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class)))
  })
  @GetMapping("/points")
  public List<MapMarkerDto> points(
      @Parameter(description = "영역 좌표 (south,west,north,east)", example = "37.55,126.96,37.60,127.02", required = true)
      @RequestParam String bbox,
      @Parameter(description = "조회 개수 제한 (1-2000)", example = "800")
      @RequestParam(defaultValue = "800") int limit,
      @Parameter(description = "마커 타입", example = "all")
      @RequestParam(defaultValue = "all") String type,
      @Parameter(description = "박물관 카테고리 목록")
      @RequestParam(name = "museumCats", required = false) List<String> museumCats,
      @Parameter(description = "문화재 지정 목록")
      @RequestParam(name = "designations", required = false) List<String> designations
  ) {
    // limit 가드(선택)
    limit = Math.max(1, Math.min(limit, 2000));
    return service.fetch(bbox, limit, type, museumCats, designations);
  }

  @Operation(
      summary = "내 위치 반경 내 마커 조회",
      description = "지정된 위도/경도를 중심으로 반경 내의 문화유산 및 박물관 마커를 조회합니다. radius는 100m-10km, limit은 1-500으로 제한됩니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "주변 마커 목록 조회 성공"),
      @ApiResponse(responseCode = "400", description = "잘못된 위도/경도 값",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class)))
  })
  @GetMapping("/nearby")
  public List<MapMarkerDto> nearby(
      @Parameter(description = "위도", example = "37.56", required = true)
      @RequestParam double lat,
      @Parameter(description = "경도", example = "126.98", required = true)
      @RequestParam double lng,
      @Parameter(description = "검색 반경 (미터, 100-10000)", example = "2000")
      @RequestParam(defaultValue = "2000") double radius,
      @Parameter(description = "마커 타입 (museum/heritage/all)", example = "all")
      @RequestParam(defaultValue = "all") String type,
      @Parameter(description = "조회 개수 제한 (1-500)", example = "100")
      @RequestParam(defaultValue = "100") int limit
  ) {
    // 간단한 방어 로직 (원하면 서비스로 내릴 수 있음)
    if (Double.isNaN(lat) || Double.isNaN(lng)) {
      throw new IllegalArgumentException("lat/lng is required");
    }
    // radius: 100m ~ 10km
    radius = Math.max(100, Math.min(radius, 10_000));
    // limit: 1 ~ 500
    limit = Math.max(1, Math.min(limit, 500));

    return service.nearby(lat, lng, radius, limit, type);
  }
}