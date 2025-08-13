package org.hh.heritagehunters.domain.map.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.ViewportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/map")
@RequiredArgsConstructor
public class ViewportController {

  private final ViewportService service;

  // GET /map/points?bbox=37.55,126.96,37.60,127.02&type=heritage&limit=800
  @GetMapping("/points")
  public List<MapMarkerDto> points(
      @RequestParam String bbox,                    // "south,west,north,east"
      @RequestParam(defaultValue = "800") int limit,
      @RequestParam(defaultValue = "all") String type // museum | heritage | all
  ) {
    return service.fetch(bbox, limit, type);
  }
}
