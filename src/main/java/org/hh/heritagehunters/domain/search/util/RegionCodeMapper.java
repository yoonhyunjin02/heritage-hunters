package org.hh.heritagehunters.domain.search.util;

import java.util.Map;
import java.util.Set;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * 지역코드 매핑 유틸리티
 * 지역코드에 대한 한글명과 줄임명을 제공하는 유틸리티 클래스입니다.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE) // 인스턴스 생성 방지
public class RegionCodeMapper {

  // 지역코드 → 한글명 매핑
  private static final Map<String, String> CODE_TO_NAME = Map.ofEntries(
      Map.entry("11", "서울특별시"),
      Map.entry("21", "부산광역시"),
      Map.entry("22", "대구광역시"),
      Map.entry("23", "인천광역시"),
      Map.entry("24", "광주광역시"),
      Map.entry("25", "대전광역시"),
      Map.entry("26", "울산광역시"),
      Map.entry("31", "경기도"),
      Map.entry("32", "강원특별자치도"),
      Map.entry("33", "충청북도"),
      Map.entry("34", "충청남도"),
      Map.entry("35", "전북특별자치도"),
      Map.entry("36", "전라남도"),
      Map.entry("37", "경상북도"),
      Map.entry("38", "경상남도"),
      Map.entry("45", "세종특별자치시"),
      Map.entry("50", "제주특별자치도"),
      Map.entry("ZZ", "전국일원")
  );

  // 지역코드 → 줄임명 매핑
  private static final Map<String, String> CODE_TO_SHORT_NAME = Map.ofEntries(
      Map.entry("11", "서울"), Map.entry("21", "부산"), Map.entry("22", "대구"),
      Map.entry("23", "인천"), Map.entry("24", "광주"), Map.entry("25", "대전"),
      Map.entry("26", "울산"), Map.entry("31", "경기"), Map.entry("32", "강원"),
      Map.entry("33", "충북"), Map.entry("34", "충남"), Map.entry("35", "전북"),
      Map.entry("36", "전남"), Map.entry("37", "경북"), Map.entry("38", "경남"),
      Map.entry("45", "세종"), Map.entry("50", "제주"), Map.entry("ZZ", "전국일원")
  );

  /**
   * 코드로 한글명 조회
   */
  public static String getKoreanName(String code) {
    return CODE_TO_NAME.getOrDefault(code, "미분류");
  }

  /**
   * 코드로 줄임명 조회
   */
  public static String getShortName(String code) {
    return CODE_TO_SHORT_NAME.getOrDefault(code, "미분류");
  }

  /**
   * 모든 지역 코드 목록 조회 (ZZ 제외)
   */
  public static Set<String> getAllRegionCodes() {
    return CODE_TO_NAME.entrySet().stream()
        .filter(entry -> !"ZZ".equals(entry.getKey())) // 전국일원 제외
        .map(java.util.Map.Entry::getKey)
        .collect(java.util.stream.Collectors.toSet());
  }
}
