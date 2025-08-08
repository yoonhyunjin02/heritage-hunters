package org.hh.heritagehunters.domain.search.util;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToEraCategoryConverter implements Converter<String, EraCategory> {

  @Override
  public EraCategory convert(String source) {
    if (source == null || source.isBlank()) {
      return EraCategory.ALL;
    }

    try {
      return EraCategory.valueOf(source);
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Unknown era code: " + source, e);
    }
  }
}
