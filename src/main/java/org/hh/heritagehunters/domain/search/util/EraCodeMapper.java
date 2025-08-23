package org.hh.heritagehunters.domain.search.util;

import java.util.Map;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class EraCodeMapper {

  // era 코드 → 한글명 매핑
  private static final Map<String, String> CODE_TO_NAME = Map.ofEntries(
      Map.entry("00", "전체"),         // 전체
      Map.entry("01", "선사시대"),     // ERA_PREHISTORIC
      Map.entry("02", "석기시대"),     // ERA_STONE
      Map.entry("03", "청동기시대"),   // ERA_BRONZE
      Map.entry("04", "철기시대"),     // ERA_IRON
      Map.entry("05", "원삼국"),       // ERA_WONSAMGUK
      Map.entry("06", "삼한시대"),     // ERA_SAMHAN
      Map.entry("07", "삼국:고구려"),  // ERA_GOGURYO
      Map.entry("08", "삼국:백제"),    // ERA_BAEKJE
      Map.entry("09", "삼국:신라"),    // ERA_SILLA
      Map.entry("10", "삼국시대"),     // ERA_THREE_KINGDOMS
      Map.entry("11", "가야"),         // ERA_GAYA
      Map.entry("12", "고대"),         // ERA_ANCIENT
      Map.entry("13", "통일신라"),     // ERA_UNIFIED_SILLA
      Map.entry("14", "발해"),         // ERA_BALHAE
      Map.entry("15", "고려시대"),     // ERA_GORYEO
      Map.entry("16", "조선시대"),     // ERA_JOSEON
      Map.entry("17", "대한제국시대"), // ERA_EMPIRE
      Map.entry("18", "일제강점기"),   // ERA_COLONIAL
      Map.entry("19", "근대"),         // ERA_GEUNDAE
      Map.entry("20", "현대/대한민국"), // ERA_MODERN
      Map.entry("21", "기타:해외왕조"), // ERA_FOREIGN
      Map.entry("22", "시대미상")      // ERA_UNKNOWN
  );


  public static String getKoreanName(String code) {
    return CODE_TO_NAME.getOrDefault(code, "미분류");
  }

  public static Map<String, String> getCodeMap() {
    return CODE_TO_NAME;
  }
}
