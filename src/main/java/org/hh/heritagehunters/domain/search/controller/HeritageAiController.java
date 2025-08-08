package org.hh.heritagehunters.domain.search.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.search.dto.AiQuestionResponse;
import org.hh.heritagehunters.domain.search.service.AiProxyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/heritage")
@RequiredArgsConstructor
public class HeritageAiController {

  private final AiProxyService aiProxyService;

  /**
   * 동일 출처로 AI 프록시 제공 (CORS 회피)
   * 예: GET /heritage/15834/ai?type=recommends&code=1
   */
  @GetMapping("/{id}/ai")
  public ResponseEntity<AiQuestionResponse> ask(
      @PathVariable Long id,
      @RequestParam String type,
      @RequestParam(required = false) Integer code
  ) {
    try {
      AiQuestionResponse resp = aiProxyService.ask(id, type, code);
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
}