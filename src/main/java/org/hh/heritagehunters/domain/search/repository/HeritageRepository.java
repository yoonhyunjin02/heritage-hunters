package org.hh.heritagehunters.domain.search.repository;

import java.util.List;
import org.hh.heritagehunters.domain.search.entity.Heritage;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HeritageRepository extends JpaRepository<Heritage, Long>, JpaSpecificationExecutor<Heritage> {

  @Query("""
        select h from Heritage h
        where h.latitude is not null and h.longitude is not null
          and (:designations is null or h.designation in :designations)
          and (:regions is null or h.region in :regions)
          and (:eras is null or h.era in :eras)
        """)
  List<Heritage> findForMap(
      @Param("designations") List<String> designations,
      @Param("regions") List<String> regions,
      @Param("eras") List<String> eras
  );

  /**
   * 지정된 좌표에서 주어진 거리 이내의 가장 가까운 문화유산을 찾습니다
   * PostgreSQL의 earth_distance 함수 사용 (정확한 지구상 거리 계산)
   */
  @Query(value = """
        SELECT * FROM heritages h
        WHERE h.latitude IS NOT NULL AND h.longitude IS NOT NULL
          AND earth_distance(ll_to_earth(h.latitude, h.longitude), ll_to_earth(:lat, :lng)) <= :maxDistanceMeters
        ORDER BY earth_distance(ll_to_earth(h.latitude, h.longitude), ll_to_earth(:lat, :lng))
        LIMIT 1
        """, nativeQuery = true)
  Heritage findNearestHeritages(
      @Param("lat") Double lat, 
      @Param("lng") Double lng, 
      @Param("maxDistanceMeters") Double maxDistanceMeters
  );
}
