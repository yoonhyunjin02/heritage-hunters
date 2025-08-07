package org.hh.heritagehunters.domain.search.util;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToEraCategoryConverter
    implements Converter<String, EraCategory> {

  @Override
  public EraCategory convert(String source) {

    if ("전체".equals(source)) {
      return EraCategory.ALL;
    }
    if ("시대미상".equals(source)) {
      return EraCategory.UNKNOWN;
    }
    return EraCategory.fromDisplayName(source)
        .orElseThrow(() -> new IllegalArgumentException(
            "Unknown era: " + source));
  }
}
