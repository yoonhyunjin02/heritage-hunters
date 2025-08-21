package org.hh.heritagehunters.domain.map.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MapMarkerDto", description = "지도 마커 정보")
public record MapMarkerDto(
    @Schema(description = "ID (문화유산인 경우 heritageId, 박물관인 경우 null)", example = "1")
    Long id,
    @Schema(description = "타입", example = "heritage", allowableValues = {"museum", "heritage"})
    String type,
    @Schema(description = "이름", example = "경복궁")
    String name,
    @Schema(description = "위도", example = "37.578617")
    double lat,
    @Schema(description = "경도", example = "126.977041")
    double lng,
    @Schema(description = "주소", example = "서울특별시 종로구 사직로 161")
    String address,
    @Schema(description = "카테고리 (문화유산의 경우 designation)", example = "사적")
    String category,
    @Schema(description = "현재 위치로부터의 거리(미터)", example = "1250.5")
    double distanceMeters
) {}