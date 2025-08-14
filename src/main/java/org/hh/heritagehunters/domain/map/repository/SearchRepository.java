package org.hh.heritagehunters.domain.map.repository;

import static org.hh.heritagehunters.common.util.HtmlSanitizer.sanitize;

import java.util.List;
import java.util.Map;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SearchRepository {

  private final NamedParameterJdbcTemplate jdbc;

  public SearchRepository(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  // MapMarkerDto(id, type, name, lat, lng, address, category, distanceMeters)
  private static final RowMapper<MapMarkerDto> MAPPER = (rs, i) -> new MapMarkerDto(
      rs.getLong("id"),
      rs.getString("type"),
      sanitize(rs.getString("name")),
      rs.getDouble("lat"),
      rs.getDouble("lng"),
      sanitize(rs.getString("address")),
      sanitize(rs.getString("category")),
      0.0 // 검색 API는 거리 계산 안 함
  );

  /**
   * DB 내부 엔티티(박물관/문화재) 전역 검색.
   * - 문화재는 전시중(exhibited_at 존재) 항목 제외
   * - 간단히 ILIKE로 매칭 (성능 필요 시 pg_trgm + similarity로 확장 가능)
   *
   * @param q     검색어
   * @param limit 최대 개수 (호출측에서 1~1000 범위로 정규화 권장)
   * @param type  museum | heritage | all
   */
  public List<MapMarkerDto> search(String q, int limit, String type) {
    final String like = "%" + q + "%";
    switch (type == null ? "all" : type) {
      case "museum":
        return searchMuseums(like, limit);
      case "heritage":
        return searchHeritages(like, limit);
      default:
        return searchAll(like, limit);
    }
  }

  private List<MapMarkerDto> searchMuseums(String like, int limit) {
    final String sql = """
      SELECT
        m.id                              AS id,
        'museum'                          AS type,
        m.name                            AS name,
        ST_Y(m.geom)                      AS lat,
        ST_X(m.geom)                      AS lng,
        COALESCE(m.address, m.region, '') AS address,
        COALESCE(m.category, '')          AS category
      FROM museums m
      WHERE (m.name ILIKE :like OR m.address ILIKE :like OR m.category ILIKE :like)
      ORDER BY m.name ASC
      LIMIT :limit
    """;
    return jdbc.query(sql, Map.of("like", like, "limit", limit), MAPPER);
  }

  private List<MapMarkerDto> searchHeritages(String like, int limit) {
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
      WHERE (h.name ILIKE :like
             OR h.address ILIKE :like
             OR h.designation ILIKE :like
             OR h.era ILIKE :like)
        AND NOT EXISTS (
          SELECT 1 FROM exhibited_at ea WHERE ea.heritages_id = h.id
        )
      ORDER BY h.name ASC
      LIMIT :limit
    """;
    return jdbc.query(sql, Map.of("like", like, "limit", limit), MAPPER);
  }

  private List<MapMarkerDto> searchAll(String like, int limit) {
    final String sql = """
      (
        SELECT
          m.id                              AS id,
          'museum'                          AS type,
          m.name                            AS name,
          ST_Y(m.geom)                      AS lat,
          ST_X(m.geom)                      AS lng,
          COALESCE(m.address, m.region, '') AS address,
          COALESCE(m.category, '')          AS category
        FROM museums m
        WHERE (m.name ILIKE :like OR m.address ILIKE :like OR m.category ILIKE :like)
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
        WHERE (h.name ILIKE :like
               OR h.address ILIKE :like
               OR h.designation ILIKE :like
               OR h.era ILIKE :like)
          AND NOT EXISTS (
            SELECT 1 FROM exhibited_at ea WHERE ea.heritages_id = h.id
          )
      )
      LIMIT :limit
    """;
    return jdbc.query(sql, Map.of("like", like, "limit", limit), MAPPER);
  }
}