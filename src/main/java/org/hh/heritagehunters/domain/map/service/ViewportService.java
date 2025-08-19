package org.hh.heritagehunters.domain.map.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.repository.ViewportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

// ViewportService.java
@Service
@RequiredArgsConstructor
public class ViewportService {
  private final ViewportRepository repo;

  public List<MapMarkerDto> fetch(String bbox, int limit, String type,
      List<String> museumCats, List<String> designations) {
    String[] sp = bbox.split(",");
    double south = Double.parseDouble(sp[0]);
    double west  = Double.parseDouble(sp[1]);
    double north = Double.parseDouble(sp[2]);
    double east  = Double.parseDouble(sp[3]);

    museumCats   = (museumCats == null || museumCats.isEmpty()) ? null : museumCats.stream().map(String::trim).toList();
    designations = (designations == null || designations.isEmpty()) ? null : designations.stream().map(String::trim).toList();

    int safeLimit = Math.max(1, Math.min(limit, 2000));

    // 타입 강제 가드
    if ("museum".equalsIgnoreCase(type)) {
      return repo.findMuseums(south, west, north, east, safeLimit, museumCats);
    }
    if ("heritage".equalsIgnoreCase(type)) {
      return repo.findHeritagesExcludingExhibited(south, west, north, east, safeLimit, designations);
    }

    // type=all : 교차 필터
    boolean onlyCats = museumCats != null && designations == null;
    boolean onlyDesi = museumCats == null && designations != null;

    if (onlyCats) {
      // 박물관 필터만 → 박물관만
      return repo.findMuseums(south, west, north, east, safeLimit, museumCats);
    }
    if (onlyDesi) {
      // 문화재 필터만 → 문화재만
      return repo.findHeritagesExcludingExhibited(south, west, north, east, safeLimit, designations);
    }

    // 둘 다 없거나 둘 다 있으면 혼합
    return repo.findAllMixed(south, west, north, east, safeLimit, museumCats, designations);
  }
}