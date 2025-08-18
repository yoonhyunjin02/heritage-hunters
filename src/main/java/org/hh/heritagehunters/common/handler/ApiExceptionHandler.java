package org.hh.heritagehunters.common.handler;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.Builder;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.ConflictException;
import org.hh.heritagehunters.common.exception.InternalServerErrorException;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * API 전용 예외 핸들러.
 * - @RestController 가 붙은 컨트롤러에만 적용됨
 * - 항상 JSON 본문으로 오류 응답을 반환
 */
@Slf4j
@RestControllerAdvice(annotations = RestController.class)
public class ApiExceptionHandler {

  // ====== 1) 프로젝트 커스텀 예외들 ======

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ApiErrorResponse> handleBadRequest(BadRequestException ex) {
    return fromErrorCode(ex.getErrorCode(), null);
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiErrorResponse> handleUnauthorized(UnauthorizedException ex) {
    return fromErrorCode(ex.getErrorCode(), null);
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(NotFoundException ex) {
    return fromErrorCode(ex.getErrorCode(), null);
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException ex) {
    return fromErrorCode(ex.getErrorCode(), null);
  }

  @ExceptionHandler(InternalServerErrorException.class)
  public ResponseEntity<ApiErrorResponse> handleInternal(InternalServerErrorException ex) {
    log.error("InternalServerErrorException", ex);
    return fromErrorCode(ex.getErrorCode(), null);
  }

  // ====== 2) 스프링/검증 공통 예외들 ======

  /** @Valid 객체 바인딩 실패 (request body, form) */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
    List<ApiFieldError> fields = new ArrayList<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      fields.add(new ApiFieldError(fe.getField(), String.valueOf(fe.getRejectedValue()), fe.getDefaultMessage()));
    }
    return fromErrorCode(ErrorCode.INVALID_INPUT_VALUE, fields);
  }

  /** @Validated 파라미터/경로변수 제약 위반 */
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
    List<ApiFieldError> fields = new ArrayList<>();
    for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
      String field = v.getPropertyPath() != null ? v.getPropertyPath().toString() : "";
      fields.add(new ApiFieldError(field, String.valueOf(v.getInvalidValue()), v.getMessage()));
    }
    return fromErrorCode(ErrorCode.INVALID_INPUT_VALUE, fields);
  }

  /** 쿼리 파라미터 등 타입 변환 실패 */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    List<ApiFieldError> fields = List.of(
        new ApiFieldError(ex.getName(), Objects.toString(ex.getValue(), null), "type mismatch")
    );
    return fromErrorCode(ErrorCode.INVALID_INPUT_VALUE, fields);
  }

  /** 필수 파라미터 누락 */
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
    List<ApiFieldError> fields = List.of(
        new ApiFieldError(ex.getParameterName(), null, "required parameter is missing")
    );
    return fromErrorCode(ErrorCode.MISSING_REQUEST_PARAMETER, fields);
  }

  /** 폼 바인딩 실패 등 */
  @ExceptionHandler(BindException.class)
  public ResponseEntity<ApiErrorResponse> handleBind(BindException ex) {
    List<ApiFieldError> fields = new ArrayList<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      fields.add(new ApiFieldError(fe.getField(), String.valueOf(fe.getRejectedValue()), fe.getDefaultMessage()));
    }
    return fromErrorCode(ErrorCode.INVALID_INPUT_VALUE, fields);
  }

  /** 잘못된 JSON 등 읽기 실패 */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
    return fromErrorCode(ErrorCode.INVALID_INPUT_VALUE, null);
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
    return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "허용되지 않은 HTTP 메서드입니다.", null);
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ApiErrorResponse> handleMediaType(HttpMediaTypeNotSupportedException ex) {
    return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "지원하지 않는 Content-Type 입니다.", null);
  }

  /** 404 라우팅 실패 (DispatcherServlet에 throw-exception-if-no-handler=true 설정 시 동작) */
  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNoHandler(NoHandlerFoundException ex) {
    return build(HttpStatus.NOT_FOUND, "NOT_FOUND", "요청한 리소스를 찾을 수 없습니다.", null);
  }

  // ====== 3) Fallback ======

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleUnknown(Exception ex) {
    log.error("Unhandled exception in API", ex);
    ErrorCode ec = ErrorCode.UNKNOWN_ERROR;
    return build(ec.getStatus(), ec.name(), ec.getMessage(), null);
  }

  // ====== 헬퍼 ======

  private ResponseEntity<ApiErrorResponse> fromErrorCode(ErrorCode code, List<ApiFieldError> fields) {
    return build(code.getStatus(), code.name(), code.getMessage(), fields);
  }

  private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message, List<ApiFieldError> fields) {
    ApiErrorResponse body = ApiErrorResponse.builder()
        .timestamp(OffsetDateTime.now().toString())
        .status(status.value())
        .code(code)
        .message(message)
        .errors(fields == null ? List.of() : fields)
        .build();
    return new ResponseEntity<>(body, new HttpHeaders(), status);
  }

  // 응답 DTO (간단히 이 파일 안에 정의)
  @Value
  @Builder
  public static class ApiErrorResponse {
    String timestamp;          // ISO-8601
    int status;                // 400, 404, ...
    String code;               // ErrorCode 이름 또는 상수 문자열
    String message;            // 사용자 메시지
    List<ApiFieldError> errors; // 필드 단위 에러(검증 실패 등)
  }

  @Value
  public static class ApiFieldError {
    String field;     // 파라미터/필드명
    String value;     // 거부된 값
    String reason;    // 메시지
  }
}