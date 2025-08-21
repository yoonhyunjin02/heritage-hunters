package org.hh.heritagehunters.domain.search.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.handler.ApiExceptionHandler;
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
@Tag(name = "heritage-ai-controller", description = "Heritage AI Controller")
public class HeritageAiController {

  private final AiProxyService aiProxyService;

  @Operation(
      summary = "유산 상세 페이지에서 전달한 정보로 AI 프록시 호출",
      description = "문화유산에 대한 AI 질문을 처리합니다. 추천, 날씨, 뉴스, 요약 등의 타입을 지원합니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "AI 응답 성공"),
      @ApiResponse(responseCode = "400", description = "지원하지 않는 요청 타입",
      content = @Content(schema = @Schema(implementation = ApiExceptionHandler.class))),
      @ApiResponse(responseCode = "404", description = "유산 정보를 찾을 수 없음",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class))),
      @ApiResponse(responseCode = "502", description = "AI 응답을 불러오지 못함",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.ApiErrorResponse.class)))
  })
  @PostMapping("/{id}/ai")
  public ResponseEntity<AiQuestionResponse> ask(
      @Parameter(description = "문화유산 ID", required = true, example = "1")
      @PathVariable Long id,
      @Parameter(description = "AI 질문 요청", required = true)
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

  @Operation(
      summary = "새로고침 버튼 클릭시 호출할 reset 프록시",
      description = "특정 문화유산의 AI 대화 상태를 초기화합니다."
  )
  @ApiResponses(value = {
      @ApiResponse(responseCode = "204", description = "초기화 성공"),
      @ApiResponse(responseCode = "502", description = "AI 서비스 연결 오류",
          content = @Content(schema = @Schema(implementation = ApiExceptionHandler.class)))
  })
  @PostMapping("/{id}/ai/reset")
  public ResponseEntity<Void> resetState(
      @Parameter(description = "문화유산 ID", required = true, example = "1")
      @PathVariable Long id,
      @Parameter(description = "AI 상태 초기화 요청", required = true)
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