package org.hh.heritagehunters.domain.search.util;

import java.util.Map;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * 종목코드 매핑 유틸리티
 * 종목코드에 대한 한글명을 제공하는 유틸리티 클래스입니다.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE) // 인스턴스 생성 방지
public class DesignationCodeMapper {

  // 종목코드 → 한글명 매핑
  private static final Map<String, String> CODE_TO_NAME = Map.ofEntries(
      Map.entry("00", "전체"),
      Map.entry("11", "국보"),
      Map.entry("12", "보물"),
      Map.entry("13", "사적"),
      Map.entry("14", "사적및명승"),
      Map.entry("15", "명승"),
      Map.entry("16", "천연기념물"),
      Map.entry("17", "국가무형유산"),
      Map.entry("18", "국가민속문화유산"),
      Map.entry("21", "시도유형문화유산"),
      Map.entry("22", "시도무형유산"),
      Map.entry("23", "시도기념물"),
      Map.entry("24", "시도민속문화유산"),
      Map.entry("25", "시도등록유산"),
      Map.entry("31", "문화유산자료"),
      Map.entry("55", "시도자연유산"),
      Map.entry("66", "시도자연유산자료"),
      Map.entry("79", "국가등록유산"),
      Map.entry("80", "이북5도 무형유산")
  );

  /**
   * 코드로 한글명 조회
   */
  public static String getKoreanName(String code) {
    return CODE_TO_NAME.getOrDefault(code, "미분류");
  }

  /**
   * 전체 코드맵 출력
   */
  public static Map<String, String> getCodeMap() {
    return CODE_TO_NAME;
  }
}
