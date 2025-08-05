package org.hh.heritagehunters.domain.search.dto;

import java.util.List;
import org.hh.heritagehunters.common.util.HtmlSanitizer;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

// 검색 요청 파라미터
public record HeritageSearchRequest(
    String keyword,
    List<String> designation,
    List<String> region,
    List<String> era,
    int page,
    int size
) {

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
    return PageRequest.of(page, size, Sort.by("name"));
  }
}

