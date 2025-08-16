package org.hh.heritagehunters.domain.map.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.util.List;
import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.repository.SearchRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

  @Mock
  SearchRepository searchRepository;

  @InjectMocks
  SearchService searchService;

  @Test
  @DisplayName("검색어가 비었으면 IllegalArgumentException")
  void empty_query_throws() {
    assertThrows(IllegalArgumentException.class, () -> searchService.search(null, "all", 30));
    assertThrows(IllegalArgumentException.class, () -> searchService.search("", "all", 30));
    assertThrows(IllegalArgumentException.class, () -> searchService.search("   ", "all", 30));
  }

  @Test
  @DisplayName("정상 검색: trim된 q, 지정 type, limit(1~500)로 Repository 위임")
  void delegates_to_repository_with_clamped_limit() {
    // given
    String q = "  숭례문  ";
    String type = "heritage";
    int limit = 50;

    var dto = new MapMarkerDto(
        1L, "heritage", "숭례문", 37.56, 126.97, "서울", "국보", 0.0
    );
    given(searchRepository.search("숭례문", limit, type)).willReturn(List.of(dto));

    // when
    var result = searchService.search(q, type, limit);

    // then
    assertThat(result).hasSize(1);
    assertThat(result.get(0).name()).isEqualTo("숭례문");

    // 호출 인자 캡처 & 검증
    ArgumentCaptor<String> qCap = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<Integer> lCap = ArgumentCaptor.forClass(Integer.class);
    ArgumentCaptor<String> tCap = ArgumentCaptor.forClass(String.class);
    verify(searchRepository).search(qCap.capture(), lCap.capture(), tCap.capture());

    assertThat(qCap.getValue()).isEqualTo("숭례문"); // trim 적용
    assertThat(lCap.getValue()).isEqualTo(limit);   // 1~500 내
    assertThat(tCap.getValue()).isEqualTo(type);
  }

  @Test
  @DisplayName("limit 상한 클램프: 10000 요청 → 500으로 제한")
  void limit_is_clamped_to_500_max() {
    // given
    given(searchRepository.search("안양", 500, "all")).willReturn(List.of());

    // when
    var result = searchService.search("안양", "all", 10_000);

    // then
    assertThat(result).isEmpty();
    verify(searchRepository).search("안양", 500, "all");
  }

  @Test
  @DisplayName("limit 하한 클램프: 0 또는 음수 → 1로 올림")
  void limit_is_clamped_to_1_min() {
    // given
    given(searchRepository.search("경복궁", 1, "museum")).willReturn(List.of());

    // when
    var resultZero = searchService.search("경복궁", "museum", 0);
    var resultNeg  = searchService.search("경복궁", "museum", -5);

    // then
    assertThat(resultZero).isEmpty();
    assertThat(resultNeg).isEmpty();
    verify(searchRepository, times(2)).search("경복궁", 1, "museum");
  }
}
