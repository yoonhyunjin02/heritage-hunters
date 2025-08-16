package org.hh.heritagehunters.domain.search.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.search.dto.AiAskRequest;
import org.hh.heritagehunters.domain.search.dto.AiQuestionResponse;
import org.hh.heritagehunters.domain.search.dto.AiResetRequest;
import org.hh.heritagehunters.domain.search.service.AiProxyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/heritage")
@RequiredArgsConstructor
public class HeritageAiController {

  private final AiProxyService aiProxyService;

  /**
   * 유산 상세 페이지에서 전달한 정보로 AI 프록시 호출
   */
  @PostMapping("/{id}/ai")
  public ResponseEntity<AiQuestionResponse> ask(
      @PathVariable Long id,
      @RequestBody AiAskRequest req
  ) {

    try {
      AiQuestionResponse resp = aiProxyService.ask(id, req);
      return ResponseEntity.ok(resp);
    } catch (NotFoundException e) {
      return ResponseEntity.status(ErrorCode.RESOURCE_NOT_FOUND.getStatus())
          .body(new AiQuestionResponse(null, "유산 정보를 찾을 수 없습니다."));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest()
          .body(new AiQuestionResponse(null, "지원하지 않는 요청 타입입니다."));
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
          .body(new AiQuestionResponse(null, "AI 응답을 불러오지 못했어요."));
    }
  }

  /**
   * 새로고침 버튼 클릭시 호출할 reset 프록시
   */
  @PostMapping("/{id}/ai/reset")
  public ResponseEntity<Void> resetState(
      @PathVariable Long id,
      @RequestBody AiResetRequest req
  ) {
    try {
      aiProxyService.resetState(id, req);
      return ResponseEntity.noContent().build();
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
    }
  }

}