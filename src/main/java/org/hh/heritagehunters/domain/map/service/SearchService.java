package org.hh.heritagehunters.domain.map.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.repository.SearchRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

  private final SearchRepository searchRepository;

  /**
   * 지도 내 DB 정보 검색
   * @param q 검색어 (필수)
   * @param type museum | heritage | all
   * @param limit 최대 결과 수
   */
  public List<MapMarkerDto> search(String q, String type, int limit) {
    if (q == null || q.isBlank()) {
      throw new IllegalArgumentException("검색어가 비어 있습니다.");
    }
    int safeLimit = Math.max(1, Math.min(limit, 500)); // 1~500 제한

    return searchRepository.search(q.trim(), safeLimit, type).stream()
        // lat/lng가 모두 0.0이면 제외
        .filter(d -> !(d.lat() == 0.0 && d.lng() == 0.0))
        .toList();
  }
}