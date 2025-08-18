package org.hh.heritagehunters.domain.map.controller;

import org.hh.heritagehunters.domain.map.dto.MapMarkerDto;
import org.hh.heritagehunters.domain.map.service.ViewportService;
import org.hh.heritagehunters.domain.oauth.service.CustomUserDetailsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ViewportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ViewportControllerTest {

  @Autowired
  MockMvc mockMvc;

  @MockitoBean
  ViewportService service;

  @MockitoBean
  CustomUserDetailsService customUserDetailsService;

  // ---------- /map/points ----------

  @Test
  @DisplayName("GET /map/points: limit 상한(2000)으로 클램프되고 type 기본값(all), 필터 미지정은 null 전달")
  void points_clampsLimit_andDefaults() throws Exception {
    when(service.fetch(anyString(), anyInt(), anyString(), isNull(), isNull()))
        .thenReturn(List.of());

    mockMvc.perform(get("/map/points")
            .param("bbox", "33,125,39,132")
            .param("limit", "50000")) // 컨트롤러에서 2000으로 클램프
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(content().json("[]"));

    verify(service).fetch(eq("33,125,39,132"), eq(2000), eq("all"), isNull(), isNull());
    verifyNoMoreInteractions(service);
  }

  @Test
  @DisplayName("GET /map/points: museumCats/designations 다중 파라미터를 리스트로 전달하고 JSON을 반환")
  void points_withFilters_andJson() throws Exception {
    List<MapMarkerDto> result = List.of(
        new MapMarkerDto(1L, "museum", "경복궁박물관", 37.58, 126.98, "서울", "역사", 0.0)
    );
    when(service.fetch(anyString(), anyInt(), anyString(), anyList(), anyList()))
        .thenReturn(result);

    mockMvc.perform(get("/map/points")
            .param("bbox", "33,125,39,132")
            .param("limit", "10")
            .param("type", "heritage") // 그대로 전달
            .param("museumCats", "역사", "미술")
            .param("designations", "국보"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].id", is(1)))
        .andExpect(jsonPath("$[0].type", is("museum")))
        .andExpect(jsonPath("$[0].name", is("경복궁박물관")))
        .andExpect(jsonPath("$[0].address", is("서울")))
        .andExpect(jsonPath("$[0].category", is("역사")))
        .andExpect(jsonPath("$[0].distanceMeters", is(0.0)));

    verify(service).fetch(eq("33,125,39,132"), eq(10), eq("heritage"),
        eq(List.of("역사", "미술")), eq(List.of("국보")));
    verifyNoMoreInteractions(service);
  }

  @Test
  @DisplayName("GET /map/points: bbox 파라미터가 누락되면 400")
  void points_missingBbox_returns400() throws Exception {
    mockMvc.perform(get("/map/points")
            .param("limit", "10"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
  }

  // ---------- /map/nearby ----------

  @Test
  @DisplayName("GET /map/nearby: radius는 [100,10000]으로, limit은 [1,500]으로 클램프되어 서비스로 전달")
  void nearby_clampsRadiusAndLimit_andCallsService() throws Exception {
    when(service.nearby(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyString()))
        .thenReturn(List.of());

    mockMvc.perform(get("/map/nearby")
                .param("lat", "37.5")
                .param("lng", "127.0")
                .param("radius", "50000") // → 10000
                .param("limit", "9999")   // → 500
            // type 기본값 "all"
        )
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));

    verify(service).nearby(eq(37.5), eq(127.0), eq(10_000.0), eq(500), eq("all"));
    verifyNoMoreInteractions(service);
  }

  @Test
  @DisplayName("GET /map/nearby: 정상 요청이면 JSON 배열 반환")
  void nearby_ok_returnsJson() throws Exception {
    List<MapMarkerDto> result = List.of(
        new MapMarkerDto(7L, "heritage", "불국사", 35.79, 129.33, "경주", "국보", 12.3)
    );
    when(service.nearby(anyDouble(), anyDouble(), anyDouble(), anyInt(), anyString()))
        .thenReturn(result);

    mockMvc.perform(get("/map/nearby")
            .param("lat", "37.56")
            .param("lng", "126.98")
            .param("radius", "1500")
            .param("type", "museum")
            .param("limit", "50"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].id", is(7)))
        .andExpect(jsonPath("$[0].type", is("heritage")))
        .andExpect(jsonPath("$[0].name", is("불국사")))
        .andExpect(jsonPath("$[0].distanceMeters", is(12.3)));

    verify(service).nearby(eq(37.56), eq(126.98), eq(1500.0), eq(50), eq("museum"));
    verifyNoMoreInteractions(service);
  }

  @Test
  @DisplayName("GET /map/nearby: lat 또는 lng가 NaN이면 IllegalArgumentException → 500")
  void nearby_nan_throws500() throws Exception {
    // lat=NaN
    mockMvc.perform(get("/map/nearby")
            .param("lat", "NaN")
            .param("lng", "126.98"))
        .andExpect(status().isInternalServerError());
    verifyNoInteractions(service);

    // lng=NaN
    mockMvc.perform(get("/map/nearby")
            .param("lat", "37.56")
            .param("lng", "NaN"))
        .andExpect(status().isInternalServerError());
    verifyNoInteractions(service);
  }

  @Test
  @DisplayName("GET /map/nearby: 필수 파라미터(lat/lng) 누락 시 400")
  void nearby_missingParams_returns400() throws Exception {
    mockMvc.perform(get("/map/nearby")
            .param("lat", "37.56"))
        .andExpect(status().isBadRequest());
    mockMvc.perform(get("/map/nearby")
            .param("lng", "126.98"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
  }
}
