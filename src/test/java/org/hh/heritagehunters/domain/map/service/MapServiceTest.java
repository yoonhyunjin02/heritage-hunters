package org.hh.heritagehunters.domain.map.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.math.BigDecimal;
import java.util.List;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.entity.Museum;
import org.hh.heritagehunters.domain.map.repository.MuseumRepository;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class MapServiceTest {

  @Mock MuseumRepository museumRepository;
  @Mock HeritageRepository heritageRepository;

  MapService mapService;

  @BeforeEach
  void setUp() {
    mapService = new MapService(museumRepository, heritageRepository);
  }

  @Test
  @DisplayName("박물관+문화재 마커를 결합해 반환한다")
  void getAllMarkers_combinesMuseumAndHeritage() {
    // given
    var m1 = museum(1L, "서울시립미술관", 37.5665, 126.9780, "서울 중구", "공립");
    var m2 = museum(2L, "국립중앙박물관", 37.5230, 126.9800, "용산구", "history");
    var h1 = heritage(10L, "숭례문", 37.5599, 126.9753, "중구", "국보");
    given(museumRepository.findAll()).willReturn(List.of(m1, m2));
    given(heritageRepository.findAll()).willReturn(List.of(h1));

    // when
    List<MapMarkerDto> result = mapService.getAllMarkers();

    // then
    assertThat(result).hasSize(3);
    assertThat(result).extracting(MapMarkerDto::type)
        .containsExactlyInAnyOrder("museum", "museum", "heritage");
  }

  @Test
  @DisplayName("위도/경도가 없는 데이터는 필터링한다")
  void getAllMarkers_filtersNullLatLng() {
    // given: m2는 위도 null, h2는 경도 null
    var m1 = museum(1L, "A", 37.0, 127.0, "addr", "cat");
    var m2 = museum(2L, "B", null, 127.1, "addr", "cat");
    var h1 = heritage(10L, "C", 36.9, 127.2, "addr", "국보");
    var h2 = heritage(11L, "D", 36.8, null, "addr", "보물");
    given(museumRepository.findAll()).willReturn(List.of(m1, m2));
    given(heritageRepository.findAll()).willReturn(List.of(h1, h2));

    // when
    List<MapMarkerDto> result = mapService.getAllMarkers();

    // then: m2, h2 제외 → 2개
    assertThat(result).hasSize(2);
    assertThat(result).allMatch(dto -> !Double.isNaN(dto.lat()) && !Double.isNaN(dto.lng()));
  }

  @Test
  @DisplayName("DTO 매핑이 정확하다(타입/이름/좌표/주소/카테고리)")
  void getAllMarkers_mappingIsCorrect() {
    // given
    var m = museum(1L, "국립현대미술관", 37.5796, 126.9770, "종로구", "공립");
    var h = heritage(2L, "덕수궁 중명전", 37.5660, 126.9749, "중구", "사적");
    given(museumRepository.findAll()).willReturn(List.of(m));
    given(heritageRepository.findAll()).willReturn(List.of(h));

    // when
    List<MapMarkerDto> result = mapService.getAllMarkers();

    // then
    var museumDto = result.stream().filter(d -> d.type().equals("museum")).findFirst().orElseThrow();
    var heritageDto = result.stream().filter(d -> d.type().equals("heritage")).findFirst().orElseThrow();

    assertThat(museumDto.id()).isEqualTo(1L);
    assertThat(museumDto.name()).isEqualTo("국립현대미술관");
    assertThat(museumDto.lat()).isEqualTo(37.5796);
    assertThat(museumDto.lng()).isEqualTo(126.9770);
    assertThat(museumDto.address()).isEqualTo("종로구");
    assertThat(museumDto.category()).isEqualTo("공립");

    assertThat(heritageDto.id()).isEqualTo(2L);
    assertThat(heritageDto.name()).isEqualTo("덕수궁 중명전");
    assertThat(heritageDto.category()).isEqualTo("사적"); // designation
  }

  // --- helpers ---
  private Museum museum(Long id, String name, Double lat, Double lng, String address, String category) {
    Museum m = new Museum();
    m.setId(id);
    m.setName(name);
    m.setLatitude(lat == null ? null : BigDecimal.valueOf(lat));
    m.setLongitude(lng == null ? null : BigDecimal.valueOf(lng));
    m.setAddress(address);
    m.setCategory(category);
    return m;
  }

  private Heritage heritage(Long id, String name, Double lat, Double lng, String address, String designation) {
    Heritage h = new Heritage();
    h.setId(id);
    h.setName(name);
    h.setLatitude(lat == null ? null : BigDecimal.valueOf(lat));
    h.setLongitude(lng == null ? null : BigDecimal.valueOf(lng));
    h.setAddress(address);
    h.setDesignation(designation);
    return h;
  }

  @Test
  @DisplayName("heritage 필터: designation+region+era 다중값으로 필터링 요청을 위임한다")
  void getMarkers_filtersHeritageByParams() {
    var h = heritage(1L, "숭례문", 37.56, 126.97, "서울", "국보");
    given(heritageRepository.findForMap(
        List.of("국보"),
        List.of("서울"),
        List.of("조선시대")))
        .willReturn(List.of(h));

    // when
    var res = mapService.getMarkers(
        "heritage",
        List.of("국보"),
        List.of("서울"),
        List.of("조선시대"));

    // then
    assertThat(res).hasSize(1);
    assertThat(res.get(0).type()).isEqualTo("heritage");
  }

  @Test
  @DisplayName("빈 필터는 null로 변환되어 전체 조회가 수행된다 (museum/heritage 모두)")
  void getMarkers_emptyFiltersBecomeNull_forBothTypes() {
    // given
    // museum 전체 조회 응답 준비
    given(museumRepository.findAll()).willReturn(List.of());
    // heritage 전체 조회 응답 준비
    given(heritageRepository.findForMap(null, null, null)).willReturn(List.of());

    // when - museum 타입
    var museumRes = mapService.getMarkers("museum", List.of(), List.of(), List.of());
    // when - heritage 타입
    var heritageRes = mapService.getMarkers("heritage", List.of(), List.of(), List.of());

    // then - 결과는 모두 비어 있음
    assertThat(museumRes).isEmpty();
    assertThat(heritageRes).isEmpty();

    // then - repository 호출 검증
    org.mockito.Mockito.verify(museumRepository).findAll();
    org.mockito.Mockito.verify(heritageRepository).findForMap(null, null, null);
  }
}