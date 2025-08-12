package org.hh.heritagehunters.domain.map.controller;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.MapService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = MapController.class)
class MapControllerTest {

  @Autowired
  MockMvc mockMvc;

  @MockitoBean
  MapService mapService;

  @MockitoBean
  org.hh.heritagehunters.domain.oauth.service.CustomUserDetailsService customUserDetailsService;


  @WithMockUser // 인증된 사용자로 요청
  @Test
  @DisplayName("HTML: /map 뷰 반환(features/map/map)")
  void map_html() throws Exception {
    mockMvc.perform(get("/map").accept(MediaType.TEXT_HTML))
        .andExpect(status().isOk())
        .andExpect(view().name("features/map/map"));
  }

  @WithMockUser // 인증된 사용자로 요청
  @Test
  @DisplayName("JSON: 단일 designation/region/era 파라미터 위임")
  void map_json_singleFilters() throws Exception {
    var dto = new MapMarkerDto(10L, "heritage", "숭례문", 37.56, 126.97, "서울특별시", "국보");
    given(mapService.getMarkers(eq("heritage"), anyList(), anyList(), anyList()))
        .willReturn(List.of(dto));

    mockMvc.perform(get("/map")
            .accept(MediaType.APPLICATION_JSON)
            .param("type", "heritage")
            .param("designation", "국보")
            .param("region", "서울특별시")
            .param("era", "조선"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].type").value("heritage"))
        .andExpect(jsonPath("$[0].category").value("국보"));

    // 전달 인자 캡처해서 단일→리스트 변환 확인
    ArgumentCaptor<List<String>> dCap = ArgumentCaptor.forClass(List.class);
    ArgumentCaptor<List<String>> rCap = ArgumentCaptor.forClass(List.class);
    ArgumentCaptor<List<String>> eCap = ArgumentCaptor.forClass(List.class);
    verify(mapService).getMarkers(eq("heritage"), dCap.capture(), rCap.capture(), eCap.capture());

    assertThat(dCap.getValue()).containsExactly("국보");
    assertThat(rCap.getValue()).containsExactly("서울특별시");
    assertThat(eCap.getValue()).containsExactly("조선");
  }

  @WithMockUser // 인증된 사용자로 요청
  @Test
  @DisplayName("JSON: 파라미터 없으면 all/null 위임")
  void map_json_noParams_callsAll() throws Exception {
    given(mapService.getMarkers(eq("all"), isNull(), isNull(), isNull()))
        .willReturn(List.of());

    mockMvc.perform(get("/map").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));

    verify(mapService).getMarkers(eq("all"), isNull(), isNull(), isNull());
  }
}