package org.hh.heritagehunters.domain.search.util;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.Getter;

public enum EraCategory {
  ALL("전체", List.of()),
  PREHISTORIC("선사시대", List.of("구석기", "선사")),
  STONE_AGE("석기시대", List.of("신석기")),
  BRONZE_AGE("청동기시대", List.of("청동기")),
  IRON_AGE("철기시대", List.of("철기")),
  SAMHAN("삼한시대", List.of("삼한")),
  GOGURYO("삼국:고구려", List.of("고구려")),
  BAEKJE("삼국:백제", List.of("백제")),
  SILLA("삼국:신라", List.of("신라")),
  THREE_KINGDOMS("삼국시대", List.of("삼국시대")),
  UNIFIED_SILLA("통일신라", List.of("통일신라")),
  BALHAE("발해", List.of("발해")),
  GORYEO("고려시대", List.of("고려")),
  JOSEON("조선시대", List.of("조선")),
  EMPIRE("대한제국시대", List.of("대한제국")),
  COLONIAL("일제강점기", List.of("일제강점기", "^(19(?:1\\d|2\\d|3\\d|4[0-5]))년")), // 1910~1945년
  UNKNOWN("시대미상", List.of("미상", "^\\s*$"));

  @Getter
  private final String displayName;
  private final List<Pattern> patterns;

  EraCategory(String displayName, List<String> regexes) {
    this.displayName = displayName;
    this.patterns = regexes.stream()
        .map(Pattern::compile)
        .toList();
  }

  /** 원본 era 텍스트를 이 카테고리에 매핑할 수 있는지 검사 */
  public boolean matches(String raw) {
    if (raw == null) return this == UNKNOWN;
    String txt = raw.replaceAll("\\s+", "");
    return patterns.stream().anyMatch(p -> p.matcher(txt).find());
  }

  /** displayName으로 enum 역조회 (옵셔널) */
  public static Optional<EraCategory> fromDisplayName(String name) {
    return Arrays.stream(values())
        .filter(e -> e.displayName.equals(name))
        .findFirst();
  }
}
