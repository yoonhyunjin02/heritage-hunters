package org.hh.heritagehunters.domain.search.specification;

import jakarta.persistence.criteria.Predicate;
import java.util.List;
import org.hh.heritagehunters.domain.search.dto.SearchCriteria;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * SearchCriteria에 기반한 동적 질의를 생성하는 클래스
 */
public class HeritageSpecification {

  /**
   * SearchCriteria에 담긴 모든 필터를 조합한 Specification을 반환한다.
   */
  public static Specification<Heritage> withCriteria(SearchCriteria criteria) {
    return Specification.allOf(
        byKeyword(criteria.getKeyword()),
        byDesignation(criteria.getDesignation()),
        byRegion(criteria.getRegion()),
        byEra(criteria.getEra())
    );
  }

  /**
   * 키워드 검색 (이름·한자명·영문명·설명 필드에 LIKE)
   */
  private static Specification<Heritage> byKeyword(String keyword) {
    return (root, query, cb) -> {
      if (!StringUtils.hasText(keyword)) {
        return cb.conjunction();
      }
      String pattern = "%" + keyword.trim() + "%";
      Predicate nameLike = cb.like(root.get("name"), pattern);
      Predicate hanjaLike = cb.like(root.get("nameHanja"), pattern);
      Predicate descLike = cb.like(root.get("description"), pattern);
      return cb.or(nameLike, hanjaLike, descLike);
    };
  }

  /**
   * 지정종목 필터 (전체가 아닌 경우 코드 리스트 IN 절)
   */
  private static Specification<Heritage> byDesignation(List<String> designations) {
    return (root, query, cb) -> {
      if (designations == null || designations.contains("00")) {
        return cb.conjunction();
      }
      return root.get("designation").in(designations);
    };
  }

  /**
   * 지역 필터 (전체가 아닌 경우 코드 리스트 IN 절)
   */
  private static Specification<Heritage> byRegion(List<String> regions) {
    return (root, query, cb) -> {
      if (regions == null || regions.contains("00")) {
        return cb.conjunction();
      }
      return root.get("region").in(regions);
    };
  }

  /**
   * 시대 필터 (전체가 아닌 경우 필드 값이 리스트에 포함된 경우)
   */
  private static Specification<Heritage> byEra(List<String> eras) {
    return (root, query, cb) -> {
      if (eras == null || eras.contains("00")) {
        return cb.conjunction();
      }
      return root.get("era").in(eras);
    };
  }
}