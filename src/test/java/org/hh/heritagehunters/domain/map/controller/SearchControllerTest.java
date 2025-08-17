package org.hh.heritagehunters.domain.map.controller;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.SearchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SearchController.class)
class SearchControllerTest {

  @Autowired
  MockMvc mockMvc;

  @MockitoBean
  SearchService searchService;

  // 시큐리티 의존 목
  @MockitoBean
  org.hh.heritagehunters.domain.oauth.service.CustomUserDetailsService customUserDetailsService;

  @WithMockUser
  @Test
  @DisplayName("검색 성공: q, type, limit 전달 → JSON 반환")
  void search_ok() throws Exception {
    var dto = new MapMarkerDto(1L, "heritage", "경복궁", 37.5796, 126.9770,
        "서울특별시", "국보", 0.0);
    given(searchService.search("경복궁", "heritage", 10))
        .willReturn(List.of(dto));

    mockMvc.perform(get("/map/search")
            .param("q", "경복궁")
            .param("type", "heritage")
            .param("limit", "10")
            .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$[0].name").value("경복궁"))
        .andExpect(jsonPath("$[0].type").value("heritage"));

    // 인자 전달 검증
    ArgumentCaptor<Integer> limitCap = ArgumentCaptor.forClass(Integer.class);
    verify(searchService).search(eq("경복궁"), eq("heritage"), limitCap.capture());
    assertThat(limitCap.getValue()).isEqualTo(10);
  }

  @WithMockUser
  @Test
  @DisplayName("q 누락 또는 공백이면 400")
  void search_bad_request_when_q_blank() throws Exception {
    mockMvc.perform(get("/map/search")
            .param("q", " ")
            .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/map/search")
            .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());
  }

  @WithMockUser
  @Test
  @DisplayName("limit 상한/하한: 애노테이션으로 1~200, 그 외면 400")
  void search_limit_range_checked_by_validation() throws Exception {
    // 0 → 400
    mockMvc.perform(get("/map/search")
            .param("q", "경복궁")
            .param("limit", "0")
            .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    // 201 → 400
    mockMvc.perform(get("/map/search")
            .param("q", "경복궁")
            .param("limit", "201")
            .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());
  }

  @WithMockUser
  @Test
  @DisplayName("type 미지정 시 기본값 all로 호출")
  void search_default_type_all() throws Exception {
    given(searchService.search("창경궁", "all", 20)).willReturn(List.of());

    mockMvc.perform(get("/map/search")
            .param("q", "창경궁")
            .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());

    verify(searchService).search("창경궁", "all", 20);
  }
}
