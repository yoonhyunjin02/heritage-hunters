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

  // GET /map/nearby?lat=37.56&lng=126.98&radius=2000&type=all&limit=100
  @GetMapping("/nearby")
  public List<MapMarkerDto> nearby(
      @RequestParam double lat,
      @RequestParam double lng,
      @RequestParam(defaultValue = "2000") double radius,  // meters
      @RequestParam(defaultValue = "all") String type,     // museum | heritage | all
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