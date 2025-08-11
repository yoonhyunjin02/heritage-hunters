package org.hh.heritagehunters.domain.search.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AiAskRequest {
  private String type;       // required: recommends | weather | news | summary
  private Integer code;      // optional: 1..3
  private String name;       // required for recommends/news
  private String address;    // required for recommends/weather
  private String content;    // optional (used by summary)
}