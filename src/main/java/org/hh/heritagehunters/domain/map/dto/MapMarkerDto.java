package org.hh.heritagehunters.domain.map.dto;

public record MapMarkerDto(
    Long id,
    String type,          // "museum" or "heritage"
    String name,
    double lat,
    double lng,
    String address,
    String category,      // heritage는 designation
    double distanceMeters // 내 위치
) {}