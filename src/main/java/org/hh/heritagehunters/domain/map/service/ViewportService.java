package org.hh.heritagehunters.domain.map.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.repository.ViewportRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ViewportService {
  private final ViewportRepository repo;

  public List<MapMarkerDto> fetch(String bbox, int limit, String type) {
    String[] sp = bbox.split(",");
    double south = Double.parseDouble(sp[0]);
    double west  = Double.parseDouble(sp[1]);
    double north = Double.parseDouble(sp[2]);
    double east  = Double.parseDouble(sp[3]);

    return repo.findByViewport(south, west, north, east, limit, type == null ? "all" : type);
  }
}