package org.hh.heritagehunters.domain.map.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.handler.ApiExceptionHandler;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.MapService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
@Tag(name = "map-controller", description = "Map Controller")
public class MapController {

  private final MapService mapService;

  @Value("${google.maps.api-key}")
  String gmapsKey;

  @GetMapping(value = "/map", produces = MediaType.TEXT_HTML_VALUE)
  public String mapPage(Model model) {
    model.addAttribute("mapsApiKey", gmapsKey);
    return "features/map/map";
  }

  @Operation(
      summary = "지도 마커 데이터 조회",
      description = "필터 조건에 따라 문화유산 및 박물관의 지도 마커 정보를 JSON 형태로 반환합니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "마커 데이터 조회 성공"),
      @ApiResponse(responseCode = "500", description = "서버 내부 오류",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.class))),
  })
  @GetMapping(value = "/map", produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseBody
  public List<MapMarkerDto> getMapMarkers(
      @Parameter(description = "마커 타입 필터 (all/heritage/museum)")
      @RequestParam(required = false, defaultValue = "all") String type,
      @Parameter(description = "문화재 지정 종류 필터", example = "국보")
      @RequestParam(required = false) String designation,
      @Parameter(description = "지역 필터", example = "서울특별시")
      @RequestParam(required = false) String region,
      @Parameter(description = "시대 필터", example = "조선시대")
      @RequestParam(required = false) String era
  ) {
    // type이 쿼리에 빈 문자열로 들어온 경우까지 all 처리
    String resolvedType = (type == null || type.isBlank()) ? "all" : type;

    // 비었으면 null, 있으면 단일 리스트로 변환
    List<String> designations =
        (designation == null || designation.isBlank()) ? null : List.of(designation);
    List<String> regions = (region == null || region.isBlank()) ? null : List.of(region);
    List<String> eras = (era == null || era.isBlank()) ? null : List.of(era);

    return mapService.getMarkers(resolvedType, designations, regions, eras);
  }

}
