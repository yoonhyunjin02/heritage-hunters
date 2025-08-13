package org.hh.heritagehunters.domain.map.repository;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class ViewportRepository {

  private final NamedParameterJdbcTemplate jdbc; // 네이티브 SQL(PostGIS 포함)을 실행

  public ViewportRepository(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  // MapMarkerDto(id, type, name, lat, lng, address, category)
  private static final RowMapper<MapMarkerDto> MAPPER = (rs, i) -> new MapMarkerDto(
      rs.getLong("id"),
      rs.getString("type"), // "museum" 또는 "heritage"
      rs.getString("name"),
      rs.getDouble("lat"),
      rs.getDouble("lng"),
      rs.getString("address"),
      rs.getString("category")
  );

  /**
   * 뷰포트(bbox) 내 포인트 조회
   * @param south 남위도
   * @param west  서경도
   * @param north 북위도
   * @param east  동경도
   * @param limit 최대 반환 개수
   * @param type  museum | heritage | all
   */
  public List<MapMarkerDto> findByViewport(
      double south, double west, double north, double east,
      int limit, String type
  ) {
    return switch (type == null ? "all" : type) {
      case "museum"   -> findMuseums(south, west, north, east, limit);
      case "heritage" -> findHeritagesExcludingExhibited(south, west, north, east, limit);
      default         -> findAllMixed(south, west, north, east, limit);
    };
  }

  // 박물관/미술관만
  public List<MapMarkerDto> findMuseums(double s, double w, double n, double e, int limit) {
    final String sql = """
      SELECT
        m.id                                   AS id,
        'museum'                               AS type,
        m.name                                 AS name,
        ST_Y(m.geom)                           AS lat,
        ST_X(m.geom)                           AS lng,
        COALESCE(m.address, m.region, '')      AS address,
        COALESCE(m.category, '')               AS category
      FROM museums m
      WHERE ST_Intersects(m.geom, ST_MakeEnvelope(:w,:s,:e,:n,4326))
      LIMIT :limit
    """;
    return jdbc.query(sql, Map.of("s", s, "w", w, "n", n, "e", e, "limit", limit), MAPPER);
  }

  // 전시 중(=exhibited_at에 존재)인 문화재는 숨김
  public List<MapMarkerDto> findHeritagesExcludingExhibited(double s, double w, double n, double e, int limit) {
    final String sql = """
      SELECT
        h.id                                   AS id,
        'heritage'                             AS type,
        h.name                                 AS name,
        ST_Y(h.geom)                           AS lat,
        ST_X(h.geom)                           AS lng,
        COALESCE(h.address, h.region, '')      AS address,
        COALESCE(h.designation, h.era, '')     AS category
      FROM heritages h
      WHERE ST_Intersects(h.geom, ST_MakeEnvelope(:w,:s,:e,:n,4326))
        AND NOT EXISTS (
          SELECT 1
          FROM exhibited_at ea
          WHERE ea.heritages_id = h.id
        )
      LIMIT :limit
    """;
    return jdbc.query(sql, Map.of("s", s, "w", w, "n", n, "e", e, "limit", limit), MAPPER);
  }

  // 둘 다(UNION ALL)
  public List<MapMarkerDto> findAllMixed(double s, double w, double n, double e, int limit) {
    final String sql = """
      (
        SELECT
          m.id                                   AS id,
          'museum'                               AS type,
          m.name                                 AS name,
          ST_Y(m.geom)                           AS lat,
          ST_X(m.geom)                           AS lng,
          COALESCE(m.address, m.region, '')      AS address,
          COALESCE(m.category, '')               AS category
        FROM museums m
        WHERE ST_Intersects(m.geom, ST_MakeEnvelope(:w,:s,:e,:n,4326))
      )
      UNION ALL
      (
        SELECT
          h.id                                   AS id,
          'heritage'                             AS type,
          h.name                                 AS name,
          ST_Y(h.geom)                           AS lat,
          ST_X(h.geom)                           AS lng,
          COALESCE(h.address, h.region, '')      AS address,
          COALESCE(h.designation, h.era, '')     AS category
        FROM heritages h
        WHERE ST_Intersects(h.geom, ST_MakeEnvelope(:w,:s,:e,:n,4326))
          AND NOT EXISTS (
            SELECT 1
            FROM exhibited_at ea
            WHERE ea.heritages_id = h.id
          )
      )
      LIMIT :limit
    """;
    return jdbc.query(sql, Map.of("s", s, "w", w, "n", n, "e", e, "limit", limit), MAPPER);
  }
}
