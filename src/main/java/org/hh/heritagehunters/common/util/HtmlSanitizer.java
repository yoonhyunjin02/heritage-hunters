package org.hh.heritagehunters.common.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class HtmlSanitizer {

  /**
   * HTML 태그를 모두 제거
   * @param input 사용자 입력
   * @return String
   */
  public static String sanitize(String input) {
    if (input == null) {
      return null;
    }
    return Jsoup.clean(input, Safelist.none());
  }
}