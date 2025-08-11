package org.hh.heritagehunters.domain.search.util;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
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
  @Getter
  private final String code;
  private final List<String> rawRegexes;
  private final List<Pattern> patterns;

  EraCategory(String displayName, List<String> regexes) {
    this.displayName = displayName;
    this.code = name();
    this.rawRegexes = regexes;
    this.patterns = regexes.stream()
        .map(Pattern::compile)
        .toList();
  }

  /**
   * DB의 era 필드(Path<String>)와 이 카테고리가 매칭할 수 있는 JPACriteria Predicate 리스트를 반환.
   */
  public Predicate toPredicate(Path<String> eraField, CriteriaBuilder cb) {
    if (this == ALL) {
      return cb.conjunction();
    }

    if (this == UNKNOWN) {
      // 1) NULL 또는 빈 문자열
      Predicate empty = cb.or(
          cb.isNull(eraField),
          cb.equal(cb.trim(eraField), "")
      );

      // 2) 다른 카테고리(rawRegexes 중 단순 텍스트)와 매칭되지 않는 것
      List<Predicate> knowns = Arrays.stream(EraCategory.values())
          .filter(cat -> cat != UNKNOWN && cat != ALL)
          .flatMap(cat -> cat.rawRegexes.stream())
          .filter(raw -> !raw.startsWith("^"))
          .map(raw -> cb.like(eraField, "%" + raw + "%"))
          .toList();

      Predicate noneMatchKnown = cb.not(cb.or(knowns.toArray(new Predicate[0])));

      // 3) “미상” 키워드 포함도 여전히 허용
      Predicate containsMisang = cb.like(eraField, "%미상%");

      return cb.or(empty, containsMisang, noneMatchKnown);
    }

    List<Predicate> ors = new ArrayList<>();
    for (String raw : rawRegexes) {
      if (raw.startsWith("^")) {
//        // 1) era에서 첫 번째 그룹(4자리 숫자)만 남기기
//        Expression<String> yearStr = cb.function(
//            "regexp_replace", String.class,
//            eraField,
//            cb.literal(".*?([0-9]{4}).*"),
//            cb.literal("\\1")
//        );
//
//        // 2) VARCHAR → INT 캐스트 후 between 검사
//        Expression<Integer> year = yearStr.as(Integer.class);
//
//        // 3) 1910~1945 사이인지 검사
//        ors.add(cb.between(year, 1910, 1945));

      } else {
        ors.add(cb.like(eraField, "%" + raw + "%"));
      }
    }
    return cb.or(ors.toArray(new Predicate[0]));
  }


  /**
   * 원본 era 텍스트를 이 카테고리에 매핑할 수 있는지 검사
   */
  public boolean matches(String raw) {
    if (raw == null) {
      return this == UNKNOWN;
    }
    String txt = raw.replaceAll("\\s+", "");
    return patterns.stream().anyMatch(p -> p.matcher(txt).find());
  }

  /**
   * displayName으로 enum 역조회 (옵셔널)
   */
  public static Optional<EraCategory> fromDisplayName(String name) {
    return Arrays.stream(values())
        .filter(e -> e.displayName.equals(name))
        .findFirst();
  }
}
