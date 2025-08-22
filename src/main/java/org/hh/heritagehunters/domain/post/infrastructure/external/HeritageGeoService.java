package org.hh.heritagehunters.domain.post.infrastructure.external;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HeritageGeoService {

  private final HeritageRepository heritageRepository;
  
  private static final double MAX_DISTANCE_METERS = 200.0;

  /**
   * 지정된 좌표에서 200m 이내의 가장 가까운 문화유산을 찾습니다
   */
  public Heritage findNearestHeritage(Double lat, Double lng) {
    if (lat == null || lng == null) {
      return null;
    }

    return heritageRepository.findAll().stream()
        .filter(h -> h.getLatitude() != null && h.getLongitude() != null)
        .filter(h -> {
          double distance = calculateDistance(lat, lng, 
              h.getLatitude().doubleValue(), h.getLongitude().doubleValue());
          return distance <= MAX_DISTANCE_METERS;
        })
        .min((h1, h2) -> {
          double dist1 = calculateDistance(lat, lng, h1.getLatitude().doubleValue(),
              h1.getLongitude().doubleValue());
          double dist2 = calculateDistance(lat, lng, h2.getLatitude().doubleValue(),
              h2.getLongitude().doubleValue());
          return Double.compare(dist1, dist2);
        })
        .orElse(null);
  }

  /**
   * Haversine 공식으로 두 좌표 간 거리를 계산합니다 (미터 단위)
   */
  public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    final int R = 6371; // 지구 반지름 (km)
    double latDistance = Math.toRadians(lat2 - lat1);
    double lngDistance = Math.toRadians(lng2 - lng1);
    double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // km를 미터로 변환
  }
}