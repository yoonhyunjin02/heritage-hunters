package org.hh.heritagehunters.domain.map.service;

import static org.hh.heritagehunters.common.util.HtmlSanitizer.sanitize;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.entity.Museum;
import org.hh.heritagehunters.domain.map.repository.MuseumRepository;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MapService {

  private final MuseumRepository museumRepository;
  private final HeritageRepository heritageRepository;

  /** 지도에 뿌릴 모든 마커(박물관 + 문화재) */
  public List<MapMarkerDto> getAllMarkers() {
    List<MapMarkerDto> museums = museumRepository.findAll().stream()
        .filter(m -> nonNullLatLng(m.getLatitude(), m.getLongitude()))
        .map(this::museumToDto)
        .collect(Collectors.toList());

    List<MapMarkerDto> heritages = heritageRepository.findAll().stream()
        .filter(h -> nonNullLatLng(h.getLatitude(), h.getLongitude()))
        .map(this::heritageToDto)
        .collect(Collectors.toList());

    return Stream.concat(museums.stream(), heritages.stream())
        .collect(Collectors.toList());
  }

  private boolean nonNullLatLng(BigDecimal lat, BigDecimal lng) {
    return lat != null && lng != null;
  }

  private MapMarkerDto museumToDto(Museum m) {
    return new MapMarkerDto(
        m.getId(),
        "museum",
        sanitize(m.getName()),
        m.getLatitude().doubleValue(),
        m.getLongitude().doubleValue(),
        sanitize(m.getAddress()),
        sanitize(m.getCategory()),
        0.0 // distanceMeters: 기본값(내 위치 기반 조회가 아니므로 0)
    );
  }

  private MapMarkerDto heritageToDto(Heritage h) {
    return new MapMarkerDto(
        h.getId(),
        "heritage",
        sanitize(h.getName()),
        h.getLatitude().doubleValue(),
        h.getLongitude().doubleValue(),
        sanitize(h.getAddress()),
        sanitize(h.getDesignation()),
        0.0 // distanceMeters: 기본값
    );
  }

  public List<MapMarkerDto> getMarkers(
      String type, List<String> designation, List<String> region, List<String> era) {

    // 빈 리스트 → null (쿼리의 "전체" 의미)
    designation = (designation == null || designation.isEmpty()) ? null : designation;
    region      = (region == null || region.isEmpty()) ? null : region;
    era         = (era == null || era.isEmpty()) ? null : era;

    boolean wantMuseum   = type == null || "all".equalsIgnoreCase(type) || "museum".equalsIgnoreCase(type);
    boolean wantHeritage = type == null || "all".equalsIgnoreCase(type) || "heritage".equalsIgnoreCase(type);

    var result = new java.util.ArrayList<MapMarkerDto>();

    if (wantMuseum) {
      museumRepository.findAll().stream()
          .filter(m -> nonNullLatLng(m.getLatitude(), m.getLongitude()))
          .map(this::museumToDto)
          .forEach(result::add);
    }
    if (wantHeritage) {
      heritageRepository.findForMap(designation, region, era).stream()
          .map(this::heritageToDto)
          .forEach(result::add);
    }
    return result;
  }
}