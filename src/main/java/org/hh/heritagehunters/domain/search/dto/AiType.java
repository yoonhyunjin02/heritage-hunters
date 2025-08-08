package org.hh.heritagehunters.domain.search.dto;

public enum AiType {
  recommends, weather, news, summary;

  public static AiType from(String s) {
    for (AiType t : values()) {
      if (t.name().equalsIgnoreCase(s)) return t;
    }
    throw new IllegalArgumentException("Unsupported ai type: " + s);
  }
}