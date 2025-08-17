package org.hh.heritagehunters.domain.map.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.MapService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class MapController {

  private final MapService mapService;

  @Value("${google.maps.api-key}")
  String gmapsKey;

  @GetMapping(value = "/map", produces = MediaType.TEXT_HTML_VALUE)
  public String mapPage(Model model) {
    model.addAttribute("mapsApiKey", gmapsKey);
    return "features/map/map";
  }

  @GetMapping(value = "/map", produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseBody
  public List<MapMarkerDto> getMapMarkers(
      @RequestParam(required = false, defaultValue = "all") String type,
      @RequestParam(required = false) String designation, // 단일
      @RequestParam(required = false) String region,      // 단일
      @RequestParam(required = false) String era          // 단일
  ) {
    // type이 쿼리에 빈 문자열로 들어온 경우까지 all 처리
    String resolvedType = (type == null || type.isBlank()) ? "all" : type;

    // 비었으면 null, 있으면 단일 리스트로 변환
    List<String> designations = (designation == null || designation.isBlank()) ? null : List.of(designation);
    List<String> regions      = (region == null || region.isBlank()) ? null : List.of(region);
    List<String> eras         = (era == null || era.isBlank()) ? null : List.of(era);

    return mapService.getMarkers(resolvedType, designations, regions, eras);
  }

}
