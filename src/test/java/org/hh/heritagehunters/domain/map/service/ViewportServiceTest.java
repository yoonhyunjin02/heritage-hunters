package org.hh.heritagehunters.domain.map.service;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.repository.ViewportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ViewportServiceTest {

  private ViewportRepository repo;
  private ViewportService service;

  @BeforeEach
  void setUp() {
    repo = mock(ViewportRepository.class);
    service = new ViewportService(repo);
  }

  @Test
  @DisplayName("fetch: bbox 파싱, limit 상한(2000) 적용, type 기본값 all, 빈 카테고리 리스트는 null 전달")
  void fetch_parsesBbox_andClampsLimit_andDefaults() {
    // given
    List<MapMarkerDto> expected = List.of(
        new MapMarkerDto(1L, "museum", "A", 37.0, 127.0, "addr", "cat", 0.0)
    );
    when(repo.findByViewport(anyDouble(), anyDouble(), anyDouble(), anyDouble(),
        anyInt(), anyString(), any(), any()))
        .thenReturn(expected);

    // when
    List<MapMarkerDto> out = service.fetch("33,125,39,132", 50_000, null,
        List.of(), null);

    // then - 결과 그대로 반환
    assertThat(out).isSameAs(expected);

    // then - repo 호출 파라미터 검증
    verify(repo).findByViewport(
        eq(33.0), eq(125.0), eq(39.0), eq(132.0),
        eq(2000), // 상한 적용
        eq("all"), // 기본값
        isNull(),  // 빈 리스트 → null
        isNull()
    );
    verifyNoMoreInteractions(repo);
  }

  @Test
  @DisplayName("fetch: bbox 형식 오류면 IllegalArgumentException")
  void fetch_badBbox_throws() {
    // when & then
    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
        service.fetch("33,125,39", 10, "museum", null, null)
    );
    assertThat(ex).hasMessage("bbox must be 'south,west,north,east'");
    verifyNoInteractions(repo);
  }

  @Test
  @DisplayName("fetch: type/limit/카테고리/지정종목이 유효하면 그대로 위임")
  void fetch_passesThrough_whenValid() {
    // given
    List<String> museumCats = List.of("역사", "미술");
    List<String> desigs = List.of("국보");
    when(repo.findByViewport(anyDouble(), anyDouble(), anyDouble(), anyDouble(),
        anyInt(), anyString(), anyList(), anyList()))
        .thenReturn(List.of());

    // when
    service.fetch("33,125,39,132", 123, "heritage", museumCats, desigs);

    // then
    verify(repo).findByViewport(
        eq(33.0), eq(125.0), eq(39.0), eq(132.0),
        eq(123),
        eq("heritage"),
        same(museumCats), // 그대로 전달
        same(desigs)
    );
    verifyNoMoreInteractions(repo);
  }

  @Test
  @DisplayName("fetch: limit 하한(1) 적용")
  void fetch_clampsLowerLimit() {
    when(repo.findByViewport(anyDouble(), anyDouble(), anyDouble(), anyDouble(),
        anyInt(), anyString(), any(), any()))
        .thenReturn(List.of());

    service.fetch("33,125,39,132", 0, "museum", null, null);

    verify(repo).findByViewport(
        anyDouble(), anyDouble(), anyDouble(), anyDouble(),
        eq(1), // 하한 적용
        eq("museum"),
        isNull(), isNull()
    );
  }

  // ---------------- nearby ----------------

  @Test
  @DisplayName("nearby: radius<=0이면 2000m, limit<=0 또는 >500이면 100, type 기본값 all")
  void nearby_defaultsApplied() {
    when(repo.findNearby(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyString()))
        .thenReturn(List.of());

    service.nearby(37.5, 127.0, -10, 9999, null);

    verify(repo).findNearby(
        eq(37.5), eq(127.0),
        eq(2000.0), // 기본 반경
        eq(100),    // 기본 limit
        eq("all")   // 기본 타입
    );
    verifyNoMoreInteractions(repo);
  }

  @Test
  @DisplayName("nearby: 유효 값이면 그대로 위임하고 결과 그대로 반환")
  void nearby_passThrough() {
    List<MapMarkerDto> expected = List.of(
        new MapMarkerDto(7L, "heritage", "불국사", 35.79, 129.33, "경주", "국보", 12.3)
    );
    when(repo.findNearby(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyString()))
        .thenReturn(expected);

    List<MapMarkerDto> out = service.nearby(37.5, 127.0, 1500, 50, "museum");

    assertThat(out).isSameAs(expected);

    verify(repo).findNearby(
        eq(37.5), eq(127.0),
        eq(1500.0),
        eq(50),
        eq("museum")
    );
    verifyNoMoreInteractions(repo);
  }
}
