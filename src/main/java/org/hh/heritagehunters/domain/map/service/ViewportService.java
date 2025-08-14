package org.hh.heritagehunters.domain.map.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.repository.ViewportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ViewportService {
  private final ViewportRepository repo;

  public List<MapMarkerDto> fetch(String bbox, int limit, String type,
      List<String> museumCats, List<String> designations) {
    String[] sp = bbox.split(",");
    if (sp.length != 4) {
      throw new IllegalArgumentException("bbox must be 'south,west,north,east'");
    }
    double south = Double.parseDouble(sp[0]);
    double west  = Double.parseDouble(sp[1]);
    double north = Double.parseDouble(sp[2]);
    double east  = Double.parseDouble(sp[3]);

    if (museumCats != null && museumCats.isEmpty()) museumCats = null;
    if (designations != null && designations.isEmpty()) designations = null;

    limit = Math.max(1, Math.min(limit, 2000)); // 여기서도 한번 가드
    return repo.findByViewport(south, west, north, east, limit,
        (type == null ? "all" : type), museumCats, designations);
  }

  // 내 위치 반경 조회 (거리순)
  public List<MapMarkerDto> nearby(double lat, double lng, double radiusMeters, int limit, String type) {
    if (radiusMeters <= 0) radiusMeters = 2000;           // 기본 2km
    if (limit <= 0 || limit > 500) limit = 100;           // 안전 상한
    return repo.findNearby(lat, lng, radiusMeters, limit, (type == null ? "all" : type));
  }
}