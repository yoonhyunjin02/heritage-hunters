package org.hh.heritagehunters.domain.search.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.search.util.EraCategory;

/**
 * 세부 검색사항을 담는 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchCriteria {

  /**
   * 검색어 (유산명, 한자명, 영어명, 설명 등)
   */
  private String keyword;

  /**
   * 종목 코드 필터 전체 선택 시 List.of("전체")
   */
  private List<String> designation = List.of("00");

  /**
   * 지역 코드 필터 전체 선택 시 List.of("전체")
   */
  private List<String> region = List.of("00");

  /**
   * 시대 필터 전체 선택 시 List.of("전체")
   */
  private List<EraCategory> era = List.of(EraCategory.UNKNOWN);

  /**
   * 페이지 번호 (1부터 시작)
   */
  private int page = 1;

  /**
   * 한 페이지당 항목 수
   */
  private int size = 16;
}
