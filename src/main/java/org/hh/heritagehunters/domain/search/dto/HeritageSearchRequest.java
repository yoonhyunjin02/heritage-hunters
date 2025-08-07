package org.hh.heritagehunters.domain.search.dto;

import java.util.List;
import org.hh.heritagehunters.common.util.HtmlSanitizer;
import org.hh.heritagehunters.domain.search.util.EraCategory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

// 검색 요청 파라미터
public record HeritageSearchRequest(
    String keyword,
    List<String> designation,
    List<String> region,
    List<EraCategory> era,
    Integer page,
    Integer size
) {

  public HeritageSearchRequest {
    if (page == null || page < 1) {
      page = 1;
    }
    if (size == null || size < 1) {
      size = 16;
    }
  }

  public SearchCriteria toCriteria() {
    String safeKeyword = HtmlSanitizer.sanitize(keyword);
    return new SearchCriteria(
        safeKeyword,
        designation,
        region,
        era,
        page,
        size
    );
  }

  public Pageable toPageable() {
    Sort sort = Sort.by(Sort.Order.asc("id"));
    return PageRequest.of(page - 1, size, sort);
  }

  /**
   * 키워드 또는 필터 중 하나라도 기본값이 아니거나, page > 1이면 true
   */
  public boolean hasSearchCondition() {
    boolean hasKeyword = keyword != null && !keyword.isBlank();

    // designation, region은 "00" 같은 코드값으로 비교해야 실제 맵 코드와 일치
    boolean hasDesignation = designation != null
        && designation.stream().anyMatch(d -> !"00".equals(d));

    boolean hasRegion = region != null
        && region.stream().anyMatch(r -> !"00".equals(r));

    // era는 ALL이 아닐 때만 필터로 간주
    boolean hasEra = era != null
        && era.stream().anyMatch(e -> e != EraCategory.ALL);

    boolean notFirstPage = page != null && page > 1;

    return hasKeyword || hasDesignation || hasRegion || hasEra || notFirstPage;
  }

}

