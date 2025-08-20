package org.hh.heritagehunters.domain.map.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.hh.heritagehunters.common.util.HtmlSanitizer.sanitize;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@ExtendWith(MockitoExtension.class)
class ViewportRepositoryTest {

  @org.mockito.Mock
  NamedParameterJdbcTemplate jdbc;

  private ViewportRepository repo() {
    return new ViewportRepository(jdbc);
  }

  // ========== 뷰포트 ==========

  @Test
  @DisplayName("findMuseums: 뷰포트 + 카테고리 필터(없음) + 종목 필터(없음) + sanitize + distanceMeters NULL→0.0")
  void findMuseums_noCats_noDesigs() throws Exception {
    double s = 33.0, w = 125.0, n = 39.0, e = 132.0;
    int limit = 50;

    Map<String, Object> row = new java.util.HashMap<>();
    row.put("id", 1L);
    row.put("type", "museum");
    row.put("name", "<b>국립박물관</b>");
    row.put("lat", 37.5);
    row.put("lng", 127.0);
    row.put("address", "<i>서울특별시</i>");
    row.put("category", "<script>x</script>역사");
    row.put("distanceMeters", null); // HashMap은 null 허용

    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(
            java.util.List.of(row),
            (sql, params) -> {
              assertThat(sql).contains("FROM museums m");
              assertThat(sql).contains("ST_Intersects(m.geom, ST_MakeEnvelope(:w,:s,:e,:n,4326))");
              // 카테고리 필터
              assertThat(sql).contains(":catsEmpty OR btrim(m.category) = ANY(:cats)");
              // 종목(문화재) 필터 - 선택된 경우에만 exhibited_at EXISTS
              assertThat(sql).contains("FROM exhibited_at ea");
              assertThat(sql).contains("JOIN heritages h ON h.id = ea.heritages_id");
              assertThat(sql).contains("regexp_split_to_table");
              assertThat(sql).doesNotContain("UNION ALL");

              assertThat(params.get("s")).isEqualTo(s);
              assertThat(params.get("w")).isEqualTo(w);
              assertThat(params.get("n")).isEqualTo(n);
              assertThat(params.get("e")).isEqualTo(e);
              assertThat(params.get("limit")).isEqualTo(limit);

              // cats
              assertThat(params.get("catsEmpty")).isEqualTo(true);
              Object cats = params.get("cats");
              assertThat(cats).isInstanceOf(String[].class);
              assertThat((String[]) cats).isEmpty();

              // desigs
              assertThat(params.get("desigsEmpty")).isEqualTo(true);
              Object desigs = params.get("desigs");
              assertThat(desigs).isInstanceOf(String[].class);
              assertThat((String[]) desigs).isEmpty();
            }
        ));

    List<MapMarkerDto> out = repo().findMuseums(s, w, n, e, limit, List.of(), List.of());

    assertThat(out).hasSize(1);
    MapMarkerDto dto = out.get(0);
    assertThat(dto.type()).isEqualTo("museum");
    assertThat(dto.name()).isEqualTo(sanitize("<b>국립박물관</b>"));
    assertThat(dto.address()).isEqualTo(sanitize("<i>서울특별시</i>"));
    assertThat(dto.category()).isEqualTo(sanitize("<script>x</script>역사"));
    assertThat(dto.distanceMeters()).isEqualTo(0.0);
  }

  @Test
  @DisplayName("findMuseums: 카테고리 필터가 있으면 catsEmpty=false, 값은 trim되어 배열로 전달 / 종목 필터는 비어있으면 desigsEmpty=true")
  void findMuseums_withCats_noDesigs() {
    double s = 33.0, w = 125.0, n = 39.0, e = 132.0;

    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(
            List.of(), // 결과는 비워도 됨
            (sql, params) -> {
              assertThat(params.get("catsEmpty")).isEqualTo(false);
              String[] cats = (String[]) params.get("cats");
              assertThat(cats).containsExactly("역사", "미술"); // 공백 trim 확인

              assertThat(params.get("desigsEmpty")).isEqualTo(true);
              String[] desigs = (String[]) params.get("desigs");
              assertThat(desigs).isEmpty();
            }
        ));

    repo().findMuseums(s, w, n, e, 10, List.of("  역사 ", "미술  "), List.of());
  }

  @Test
  @DisplayName("findHeritagesExcludingExhibited: 전시중 제외, designation 필터 분해 매칭, sanitize 적용")
  void findHeritages_withDesigs() throws Exception {
    double s = 33.0, w = 125.0, n = 39.0, e = 132.0;

    // Map.of(...) 대신 HashMap 사용 (null 허용)
    Map<String, Object> row = new java.util.HashMap<>();
    row.put("id", 77L);
    row.put("type", "heritage");
    row.put("name", "경주 <b>불국사</b>");
    row.put("lat", 35.8);
    row.put("lng", 129.3);
    row.put("address", "경북 <i>경주시</i>");
    row.put("category", "통일신라");
    row.put("distanceMeters", null); // 또는 이 줄을 아예 생략해도 됩니다

    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(
            java.util.List.of(row),
            (sql, params) -> {
              assertThat(sql).contains("FROM heritages h");
              assertThat(sql).contains("NOT EXISTS (SELECT 1 FROM exhibited_at");
              assertThat(sql).contains("regexp_split_to_table");
              assertThat(params.get("desigsEmpty")).isEqualTo(false);
              String[] desigs = (String[]) params.get("desigs");
              assertThat(desigs).containsExactly("국보", "보물");
            }
        ));

    List<MapMarkerDto> out =
        repo().findHeritagesExcludingExhibited(s, w, n, e, 5, List.of(" 국보", "보물 "));

    assertThat(out).hasSize(1);
    MapMarkerDto dto = out.get(0);
    assertThat(dto.type()).isEqualTo("heritage");
    assertThat(dto.name()).isEqualTo(sanitize("경주 <b>불국사</b>"));
    assertThat(dto.address()).isEqualTo(sanitize("경북 <i>경주시</i>"));
    assertThat(dto.category()).isEqualTo(sanitize("통일신라"));
    assertThat(dto.distanceMeters()).isEqualTo(0.0);
  }

  @Test
  @DisplayName("findAllMixed: museums + heritages UNION ALL, cats/desigs 필터 모두 반영")
  void findAllMixed_union() throws Exception {
    double s = 33.0, w = 125.0, n = 39.0, e = 132.0;

    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(
            List.of(
                new java.util.HashMap<String, Object>() {{
                  put("id", 1L); put("type", "museum");
                  put("name", "경복궁박물관"); put("lat", 37.58); put("lng", 126.98);
                  put("address", "서울"); put("category", "역사");
                  put("distanceMeters", null); // OK
                }},
                new java.util.HashMap<String, Object>() {{
                  put("id", 2L); put("type", "heritage");
                  put("name", "경복궁"); put("lat", 37.58); put("lng", 126.98);
                  put("address", "서울"); put("category", "조선시대");
                  put("distanceMeters", null); // OK
                }}
            ),
            (sql, params) -> {
              assertThat(sql).contains("UNION ALL");
              assertThat(sql).contains("FROM museums m");
              assertThat(sql).contains("FROM heritages h");
              assertThat(sql).contains(":catsEmpty OR btrim(m.category) = ANY(:cats)");
              assertThat(sql).contains("NOT EXISTS (SELECT 1 FROM exhibited_at");
              assertThat(sql).contains("regexp_split_to_table");

              assertThat(params.get("catsEmpty")).isEqualTo(false);
              assertThat(params.get("desigsEmpty")).isEqualTo(false);
              assertThat((String[]) params.get("cats")).containsExactly("역사");
              assertThat((String[]) params.get("desigs")).containsExactly("국보");
            }
        ));

    List<MapMarkerDto> out =
        repo().findAllMixed(s, w, n, e, 10, List.of("역사"), List.of("국보"));

    assertThat(out).hasSize(2);
    assertThat(out.get(0).type()).isEqualTo("museum");
    assertThat(out.get(1).type()).isEqualTo("heritage");
  }

  @Test
  @DisplayName("findByViewport: type 분기 - museum/heritage/all")
  void findByViewport_dispatch() {
    // museum
    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(List.of(), (sql, params) -> {
          assertThat(sql).contains("FROM museums m");
          assertThat(sql).doesNotContain("UNION ALL");
        }));
    repo().findByViewport(33,125,39,132,5,"museum", List.of(), List.of());

    // heritage
    reset(jdbc);
    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(List.of(), (sql, params) -> {
          assertThat(sql).contains("FROM heritages h");
          assertThat(sql).contains("NOT EXISTS (SELECT 1 FROM exhibited_at");
          assertThat(sql).doesNotContain("UNION ALL");
        }));
    repo().findByViewport(33,125,39,132,5,"heritage", List.of(), List.of());

    // all (null → default)
    reset(jdbc);
    when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class)))
        .thenAnswer(sqlParamAnswer(List.of(), (sql, params) -> {
          assertThat(sql).contains("UNION ALL");
        }));
    repo().findByViewport(33,125,39,132,5,null, List.of(), List.of());
  }

  // ========== 근처 검색(거리순) ==========

  @Test
  @DisplayName("findNearby: museum - ST_DWithin + ST_DistanceSphere, ORDER BY distanceMeters, sanitize 및 거리값 매핑")
  void findNearby_museums() throws Exception {
    double lat = 37.5, lng = 127.0, radius = 1500, dist = 123.45;
    int limit = 20;

    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer(mapParamAnswer(
            List.of(Map.of(
                "id", 10L, "type", "museum",
                "name", "<b>한강박물관</b>",
                "lat", lat, "lng", lng,
                "address", "<i>서울</i>",
                "category", "역사",
                "distanceMeters", dist
            )),
            (sql, params) -> {
              assertThat(sql).contains("FROM museums m");
              assertThat(sql).contains("ST_DWithin");
              assertThat(sql).contains("ST_DistanceSphere");
              assertThat(sql).contains("ORDER BY distanceMeters ASC");
              assertThat(params.get("lat")).isEqualTo(lat);
              assertThat(params.get("lng")).isEqualTo(lng);
              assertThat(params.get("radius")).isEqualTo(radius);
              assertThat(params.get("limit")).isEqualTo(limit);
            }
        ));

    List<MapMarkerDto> out = repo().findNearby(lat, lng, radius, limit, "museum");

    assertThat(out).hasSize(1);
    MapMarkerDto dto = out.get(0);
    assertThat(dto.type()).isEqualTo("museum");
    assertThat(dto.name()).isEqualTo(sanitize("<b>한강박물관</b>"));
    assertThat(dto.address()).isEqualTo(sanitize("<i>서울</i>"));
    assertThat(dto.distanceMeters()).isEqualTo(dist);
  }

  @Test
  @DisplayName("findNearby: heritage - 전시중 제외 + 거리순")
  void findNearby_heritages() {
    double lat = 37.5, lng = 127.0, radius = 2000;

    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer(mapParamAnswer(
            List.of(),
            (sql, params) -> {
              assertThat(sql).contains("FROM heritages h");
              assertThat(sql).contains("NOT EXISTS (SELECT 1 FROM exhibited_at");
              assertThat(sql).contains("ST_DWithin");
              assertThat(sql).contains("ORDER BY distanceMeters ASC");
            }
        ));

    repo().findNearby(lat, lng, radius, 10, "heritage");
  }

  @Test
  @DisplayName("findNearby: all - UNION ALL + 거리순")
  void findNearby_allMixed() {
    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer(mapParamAnswer(
            List.of(),
            (sql, params) -> {
              assertThat(sql).contains("UNION ALL");
              assertThat(sql).contains("ORDER BY distanceMeters ASC");
            }
        ));

    repo().findNearby(37.5, 127.0, 1000, 5, null);
  }

  // ========== 헬퍼 ==========
  /** jdbc.query(sql, MapSqlParameterSource, RowMapper) 오버로드용 */
  private Answer<List<MapMarkerDto>> sqlParamAnswer(
      List<Map<String, Object>> rows,
      SqlParamAsserter asserter
  ) {
    return new Answer<>() {
      @SuppressWarnings("unchecked")
      @Override public List<MapMarkerDto> answer(InvocationOnMock inv) throws Throwable {
        String sql = inv.getArgument(0);
        MapSqlParameterSource p = inv.getArgument(1);
        RowMapper<MapMarkerDto> mapper = (RowMapper<MapMarkerDto>) inv.getArgument(2);

        if (asserter != null) asserter.assertSqlAndParams(sql, p.getValues());

        List<MapMarkerDto> list = new ArrayList<>();
        int idx = 0;
        for (Map<String, Object> row : rows) {
          ResultSet rs = mockResultSet(row);
          list.add(mapper.mapRow(rs, idx++));
        }
        return list;
      }
    };
  }

  /** jdbc.query(sql, Map<String,Object>, RowMapper) 오버로드용 */
  private Answer<List<MapMarkerDto>> mapParamAnswer(
      List<Map<String, Object>> rows,
      SqlParamAsserter asserter
  ) {
    return new Answer<>() {
      @SuppressWarnings("unchecked")
      @Override public List<MapMarkerDto> answer(InvocationOnMock inv) throws Throwable {
        String sql = inv.getArgument(0);
        Map<String, Object> params = inv.getArgument(1);
        RowMapper<MapMarkerDto> mapper = (RowMapper<MapMarkerDto>) inv.getArgument(2);

        if (asserter != null) asserter.assertSqlAndParams(sql, params);

        List<MapMarkerDto> list = new ArrayList<>();
        int idx = 0;
        for (Map<String, Object> row : rows) {
          ResultSet rs = mockResultSet(row);
          list.add(mapper.mapRow(rs, idx++));
        }
        return list;
      }
    };
  }

  private ResultSet mockResultSet(Map<String, Object> row) throws Exception {
    ResultSet rs = mock(ResultSet.class);
    when(rs.getLong("id")).thenReturn(((Number) row.get("id")).longValue());
    when(rs.getString("type")).thenReturn((String) row.get("type"));
    when(rs.getString("name")).thenReturn((String) row.get("name"));
    when(rs.getDouble("lat")).thenReturn(((Number) row.get("lat")).doubleValue());
    when(rs.getDouble("lng")).thenReturn(((Number) row.get("lng")).doubleValue());
    when(rs.getString("address")).thenReturn((String) row.get("address"));
    when(rs.getString("category")).thenReturn((String) row.get("category"));
    Object dist = row.get("distanceMeters");
    when(rs.getObject("distanceMeters")).thenReturn(dist);
    if (dist != null) {
      when(rs.getDouble("distanceMeters")).thenReturn(((Number) dist).doubleValue());
    }
    return rs;
  }

  @FunctionalInterface
  interface SqlParamAsserter {
    void assertSqlAndParams(String sql, Map<String, Object> params);
  }
}
