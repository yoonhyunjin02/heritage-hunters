package org.hh.heritagehunters.domain.search.dto;

import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.util.DesignationCodeMapper;
import org.hh.heritagehunters.domain.search.util.RegionCodeMapper;

// 검색 결과 응답
public record HeritageResponse(
    Long id,
    String name,
    String nameHanja,
    String thumbnailUrl,
    String designation,
    String region,
    String address,
    String era,
    String eraDetail,
    String description
) {

  public static HeritageResponse fromEntity(Heritage h) {
    return new HeritageResponse(
        h.getId(),
        h.getName(),
        h.getNameHanja(),
        h.getThumbnailUrl(),
        DesignationCodeMapper.getKoreanName(h.getDesignation()),
        RegionCodeMapper.getKoreanName(h.getRegion()),
        h.getAddress(),
        h.getEra(),
        h.getEraDetail(),
        h.getDescription()
    );
  }
}
