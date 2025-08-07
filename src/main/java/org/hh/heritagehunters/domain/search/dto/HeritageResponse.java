package org.hh.heritagehunters.domain.search.dto;

import org.hh.heritagehunters.domain.search.entity.Heritage;

// 검색 결과 응답
public record HeritageResponse(
    Long id,
    String name,
    String nameHanja,
    String designation,
    String region,
    String era,
    String description
) {

  public static HeritageResponse fromEntity(Heritage h) {
    return new HeritageResponse(
        h.getId(),
        h.getName(),
        h.getNameHanja(),
        h.getDesignation(),
        h.getRegion(),
        h.getEra(),
        h.getDescription()
    );
  }
}
