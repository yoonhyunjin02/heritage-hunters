package org.hh.heritagehunters.domain.search.specification;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.hh.heritagehunters.domain.search.dto.SearchCriteria;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.util.EraCategory;
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
  public static Specification<Heritage> byEra(List<EraCategory> eras) {
    return (root, query, cb) -> {
      // 1) 필터 미지정(null/empty), 2) 전체(ALL) 혹은 3) 미상만(UNKNOWN) → 전체조회
      if (eras == null
          || eras.isEmpty()
          || eras.contains(EraCategory.ALL)
          || (eras.size() == 1 && eras.contains(EraCategory.UNKNOWN))) {
        return cb.conjunction();
      }

      Path<String> eraField = root.get("era");
      List<Predicate> preds = new ArrayList<>();

      for (EraCategory cat : eras) {
        // UNKNOWN은 regex 매칭으로만, 이름으로는 OR 처리 안 할 수도 있으나
        if (cat == EraCategory.UNKNOWN) {
          preds.add(cb.isNull(eraField)); // 또는 cb.not(cb.isNotNull(eraField)) 등 DB와 맞춰 수정
        } else {
          preds.add(cb.like(eraField, "%" + cat.getDisplayName() + "%"));
        }
      }
      return cb.or(preds.toArray(new Predicate[0]));
    };
  }

}