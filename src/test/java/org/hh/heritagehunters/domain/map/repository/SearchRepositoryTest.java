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
import org.mockito.Mock;
import org.mockito.stubbing.Answer;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@ExtendWith(MockitoExtension.class)
class SearchRepositoryTest {

  @Mock
  NamedParameterJdbcTemplate jdbc;

  private SearchRepository repo() {
    return new SearchRepository(jdbc);
  }

  @Test
  @DisplayName("type=museum: museums 전용 SQL과 파라미터가 사용되고 RowMapper가 정상 매핑된다")
  void search_museums() throws Exception {
    // given
    String q = "국립";
    int limit = 10;
    String expectedLike = "%" + q + "%";

    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer(museumAnswer(
            // 행 2개를 흉내 내어 RowMapper가 제대로 매핑되는지 확인
            List.of(
                Map.of(
                    "id", 1L,
                    "type", "museum",
                    "name", "<b>국립중앙박물관</b>",
                    "lat", 37.5234,
                    "lng", 126.9876,
                    "address", "<i>서울 용산구</i>",
                    "category", "<script>alert('x')</script>고고학"
                ),
                Map.of(
                    "id", 2L,
                    "type", "museum",
                    "name", "국립현대미술관",
                    "lat", 37.5796,
                    "lng", 126.9770,
                    "address", "서울 종로구",
                    "category", "미술"
                )
            ),
            // SQL/파라미터 검증 람다
            (sql, params) -> {
              assertThat(sql).contains("FROM museums m");
              assertThat(sql).contains("m.name ILIKE :like");
              assertThat(sql).doesNotContain("UNION ALL");
              assertThat(sql).contains("ORDER BY m.name ASC");
              assertThat(sql).contains("LIMIT :limit");

              assertThat(params.get("like")).isEqualTo(expectedLike);
              assertThat(params.get("limit")).isEqualTo(limit);
            }
        ));

    // when
    List<MapMarkerDto> out = repo().search(q, limit, "museum");

    // then
    assertThat(out).hasSize(2);

    MapMarkerDto first = out.get(0);
    // sanitize가 적용된 값인지 검증 (sanitize 결과와 동일해야 함)
    assertThat(first.type()).isEqualTo("museum");
    assertThat(first.id()).isEqualTo(1L);
    assertThat(first.name()).isEqualTo(sanitize("<b>국립중앙박물관</b>"));
    assertThat(first.address()).isEqualTo(sanitize("<i>서울 용산구</i>"));
    assertThat(first.category()).isEqualTo(sanitize("<script>alert('x')</script>고고학"));
    assertThat(first.lat()).isEqualTo(37.5234);
    assertThat(first.lng()).isEqualTo(126.9876);
    assertThat(first.distanceMeters()).isEqualTo(0.0);

    MapMarkerDto second = out.get(1);
    assertThat(second.type()).isEqualTo("museum");
    assertThat(second.id()).isEqualTo(2L);
    assertThat(second.name()).isEqualTo(sanitize("국립현대미술관"));
  }

  @Test
  @DisplayName("type=heritage: heritages 전용 SQL(전시중 제외)과 파라미터가 사용되고 RowMapper가 정상 매핑된다")
  void search_heritages() throws Exception {
    // given
    String q = "신라";
    int limit = 5;
    String expectedLike = "%" + q + "%";

    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer(museumAnswer(
            List.of(
                Map.of(
                    "id", 101L,
                    "type", "heritage",
                    "name", "경주 불국사",
                    "lat", 35.7900,
                    "lng", 129.3320,
                    "address", "경북 경주시",
                    "category", "통일신라"
                )
            ),
            (sql, params) -> {
              assertThat(sql).contains("FROM heritages h");
              assertThat(sql).contains("h.name ILIKE :like");
              assertThat(sql).contains("NOT EXISTS (SELECT 1 FROM exhibited_at");
              assertThat(sql).doesNotContain("UNION ALL");
              assertThat(sql).contains("LIMIT :limit");

              assertThat(params.get("like")).isEqualTo(expectedLike);
              assertThat(params.get("limit")).isEqualTo(limit);
            }
        ));

    // when
    List<MapMarkerDto> out = repo().search(q, limit, "heritage");

    // then
    assertThat(out).hasSize(1);
    MapMarkerDto dto = out.get(0);
    assertThat(dto.type()).isEqualTo("heritage");
    assertThat(dto.id()).isEqualTo(101L);
    assertThat(dto.name()).isEqualTo(sanitize("경주 불국사"));
    assertThat(dto.address()).isEqualTo(sanitize("경북 경주시"));
    assertThat(dto.category()).isEqualTo(sanitize("통일신라"));
    assertThat(dto.lat()).isEqualTo(35.7900);
    assertThat(dto.lng()).isEqualTo(129.3320);
  }

  @Test
  @DisplayName("type=all: museums + heritages UNION ALL SQL과 limit이 적용된다")
  void search_all() throws Exception {
    // given
    String q = "경복";
    int limit = 7;
    String expectedLike = "%" + q + "%";

    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer(museumAnswer(
            List.of(
                Map.of(
                    "id", 11L,
                    "type", "museum",
                    "name", "경복궁박물관",
                    "lat", 37.5796,
                    "lng", 126.9770,
                    "address", "서울 종로구",
                    "category", "역사"
                ),
                Map.of(
                    "id", 22L,
                    "type", "heritage",
                    "name", "경복궁",
                    "lat", 37.5796,
                    "lng", 126.9770,
                    "address", "서울 종로구",
                    "category", "조선시대"
                )
            ),
            (sql, params) -> {
              assertThat(sql).contains("FROM museums m");
              assertThat(sql).contains("FROM heritages h");
              assertThat(sql).contains("UNION ALL");
              assertThat(sql).contains("LIMIT :limit");

              assertThat(params.get("like")).isEqualTo(expectedLike);
              assertThat(params.get("limit")).isEqualTo(limit);
            }
        ));

    // when
    List<MapMarkerDto> out = repo().search(q, limit, "all");

    // then
    assertThat(out).hasSize(2);
    assertThat(out.get(0).type()).isEqualTo("museum");
    assertThat(out.get(1).type()).isEqualTo("heritage");
  }

  @Test
  @DisplayName("type=null 또는 알 수 없는 값이면 all 분기(UNION ALL)로 동작한다")
  void search_default_all_when_null_or_unknown() {
    // given
    when(jdbc.query(anyString(), anyMap(), any(RowMapper.class)))
        .thenAnswer((Answer<List<MapMarkerDto>>) inv -> {
          String sql = inv.getArgument(0);
          assertThat(sql).contains("UNION ALL"); // all 분기인지 확인
          return List.of(); // 내용은 비어 있어도 OK
        });

    // when
    repo().search("abc", 3, null);      // null → all
    repo().search("abc", 3, "unknown"); // 알 수 없는 값 → default(all)

    // then
    verify(jdbc, times(2)).query(anyString(), anyMap(), any(RowMapper.class));
  }

  // ======= 헬퍼 =======

  /**
   * jdbc.query(...) 호출을 가로채어
   * 1) 전달된 SQL/파라미터를 assert 검증하고
   * 2) 주어진 rows를 기반으로 ResultSet을 mock해 RowMapper로 매핑하여 List로 반환
   */
  private Answer<List<MapMarkerDto>> museumAnswer(
      List<Map<String, Object>> rows,
      SqlParamAsserter asserter
  ) {
    return new Answer<>() {
      @SuppressWarnings("unchecked")
      @Override public List<MapMarkerDto> answer(InvocationOnMock inv) throws Throwable {
        String sql = inv.getArgument(0);
        Map<String, Object> params = inv.getArgument(1);
        RowMapper<MapMarkerDto> mapper = (RowMapper<MapMarkerDto>) inv.getArgument(2);

        // SQL/파라미터 단언
        if (asserter != null) asserter.assertSqlAndParams(sql, params);

        // RowMapper로 결과 생성
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
    return rs;
  }

  @FunctionalInterface
  interface SqlParamAsserter {
    void assertSqlAndParams(String sql, Map<String, Object> params);
  }
}
