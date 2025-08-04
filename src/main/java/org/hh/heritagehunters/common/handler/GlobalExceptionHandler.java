package org.hh.heritagehunters.common.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Request;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.ConflictException;
import org.hh.heritagehunters.common.exception.InternalServerErrorException;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

  /**
   * BadRequestException
   * 주로 파일 업로드, 게시글 작성 등에서 발생하는 잘못된 요청 처리
   */
  @ExceptionHandler(BadRequestException.class)
  public String handleBadRequestException(
      BadRequestException e,
      HttpServletRequest request,
      RedirectAttributes redirectAttributes) {

    log.warn("BadRequestException: {}, URI: {}", e.getMessage(), request.getRequestURI());

    // 토스트 메시지로 사용자에게 알림
    addToastMessage(redirectAttributes, "error", e.getErrorCode().getMessage());

    return redirectToPreviousPage(request);
  }

  /**
   * UnauthorizedException 인증이 필요한 페이지 접근 시 로그인 페이지로 리다이렉트
   * 로그인 폼 자체의 인증 실패는 컨트롤러에서 처리
   */
  @ExceptionHandler(UnauthorizedException.class)
  public String handleUnauthorizedException(
      UnauthorizedException e,
      HttpServletRequest request,
      RedirectAttributes redirectAttributes) {

    log.warn("UnauthorizedException: {}, URI: {}", e.getMessage(), request.getRequestURI());

    String requestURI = request.getRequestURI();

    // 인증이 필요한 다른 페이지 처리
    if (!requestURI.contains("/auth/login") && !requestURI.contains("/login")) {
      // 로그인 후 돌아갈 URL 저장
      redirectAttributes.addFlashAttribute("returnUrl", requestURI);
      redirectAttributes.addFlashAttribute("loginMessage", "로그인이 필요합니다.");

      return "redirect:/auth/login";
    }

    // 로그인 페이지에서 발생한 경우
    return "redirect:/auth/login";
  }

  /**
   * NotFoundException 게시글, 사용자 등을 찾을 수 없는 경우 처리
   */
  @ExceptionHandler(NotFoundException.class)
  public String handleNotFoundException(
      NotFoundException e,
      HttpServletRequest request,
      RedirectAttributes redirectAttributes) {

    log.warn("NotFoundException: {}, URI: {}", e.getMessage(), request.getRequestURI());

    String requestURI = request.getRequestURI();

    // 1. 게시글을 찾을 수 없는 경우 - 게시글 목록으로 리다이렉트
    if (requestURI.matches("/posts/\\d+")) {
      addToastMessage(redirectAttributes, "warning",
          "요청하신 게시글을 찾을 수 없습니다. 다른 게시글들을 확인해보세요.");
      return "redirect:/posts";
    }

    // 2. 문화유산을 찾을 수 없는 경우 - 문화유산 목록으로
    if (requestURI.matches("/heritages/\\d+")) {
      addToastMessage(redirectAttributes, "info",
          "해당 문화유산 정보를 찾을 수 없습니다. 전체 목록에서 다른 유산을 둘러보세요.");
      return "redirect:/heritages";
    }

    // 3. 사용자 프로필을 찾을 수 없는 경우 - 리더보드로
    if (requestURI.matches("/users/me")) {
      addToastMessage(redirectAttributes, "warning",
          "사용자 정보를 찾을 수 없습니다.");
      return "redirect:/";
    }

    // 4. 기타 경우 - 홈으로 리다이렉트
    addToastMessage(redirectAttributes, "info",
        "요청하신 페이지를 찾을 수 없습니다. 홈페이지로 이동합니다.");
    return "redirect:/";
  }

  /**
   * ConflictException
   * 중복 데이터, 이미 처리된 요청 등의 충돌 상황
   */
  @ExceptionHandler(ConflictException.class)
  public String handleConflictException(
      ConflictException  e,
      HttpServletRequest request,
      RedirectAttributes redirectAttributes) {

    log.warn("ConflictException: {}, URI: {}", e.getMessage(), request.getRequestURI());

    // 모든 충돌 에러는 토스트 메시지로 처리
    addToastMessage(redirectAttributes, "warning", e.getErrorCode().getMessage());

    return redirectToPreviousPage(request);
  }

  /**
   * InternalServerErrorException
   */
  @ExceptionHandler(InternalServerErrorException.class)
  public String handleInternalServerErrorException(
      InternalServerErrorException e,
      HttpServletRequest request,
      HttpServletResponse response) {

    // 1. 에러 상황을 알기 위한 내부 로그
    log.error("InternalServerErrorException 발생: {}, URI: {}",
        e.getMessage(), request.getRequestURI(), e);

    // 2. HTTP 상태는 내부적으로 500 지정
    response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());

    // 3. 사용자에게는 아무 메시지도 안 보여줌
    return "redirect:/";
  }

  /**
   * MaxUploadSizeExceededException
   * 파일 업로드 크기 초과 처리
   * 게시글 이미지, 프로필 이미지 업로드 시 발생
   */
  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public String handleMaxUploadSizeExceededException(
      MaxUploadSizeExceededException e,
      HttpServletRequest request,
      RedirectAttributes redirectAttributes) {

    log.warn("File size exceeded: {}, URI: {}", e.getMessage(), request.getRequestURI());

    String requestURI = request.getRequestURI();
    long maxSize = e.getMaxUploadSize();
    String maxSizeStr = formatFileSize(maxSize);

    // 업로드 위치에 따른 구체적인 메시지 제공
    String errorMessage;
    if (requestURI.contains("/posts/") && requestURI.contains("/images")) {
      errorMessage = String.format("게시글 이미지 크기가 너무 큽니다. (최대: %s)", maxSizeStr);
    } else if (requestURI.contains("/users/me")) {
      errorMessage = String.format("프로필 이미지 크기가 너무 큽니다. (최대: %s)", maxSizeStr);
    } else {
      errorMessage = String.format("파일 크기가 제한을 초과했습니다. (최대: %s)", maxSizeStr);
    }

    addToastMessage(redirectAttributes, "error", errorMessage);
    return redirectToPreviousPage(request);
  }

  /**
   * 예상치 못한 모든 예외 처리
   */
  @ExceptionHandler(Exception.class)
  public String handleException(Exception e,
      HttpServletRequest request,
      HttpServletResponse response,
      Model model,
      RedirectAttributes redirectAttributes) {

    log.error("Unexpected Exception: {}. URI: {}", e.getMessage(), request.getRequestURI());

    response.setStatus(ErrorCode.INTERNAL_SERVER_ERROR.getStatus().value());
    return "redirect:/";
  }

  // ================= 유틸리티 메서드들 =================

  /**
   * 토스트 메시지 추가 - RedirectAttributes에 플래시 속성으로 전달
   * Thymeleaf 템플릿에서 toastType, toastMessage로 접근 가능
   *
   * @param redirectAttributes 리다이렉트 시 전달할 속성
   * @param type 메시지 타입 (success, error, warning, info)
   * @param message 표시할 메시지
   */
  private void addToastMessage(RedirectAttributes redirectAttributes, String type, String message) {
    redirectAttributes.addFlashAttribute("toastType", type);
    redirectAttributes.addFlashAttribute("toastMessage", message);
  }

  /**
   * 이전 페이지로 리다이렉트 - 적절한 fallback 페이지 제공
   * Referer 헤더가 없거나 부적절한 경우 도메인별 기본 페이지로 이동
   *
   * @param request HTTP 요청 객체
   * @return 리다이렉트할 경로
   */
  private String redirectToPreviousPage(HttpServletRequest request) {
    String referer = request.getHeader("Referer");
    String requestURI = request.getRequestURI();

    // 도메인별 적절한 fallback 페이지 설정
    String fallbackPage = "/";

    if (requestURI.contains("/posts")) {
      fallbackPage = "/posts";  // 게시글 목록으로
    } else if (requestURI.contains("/heritages")) {
      fallbackPage = "/heritages";  // 문화유산 목록으로
    } else if (requestURI.contains("/museums")) {
      fallbackPage = "/museums";  // 박물관 목록으로
    } else if (requestURI.contains("/users/me")) {
      fallbackPage = "/users/me";  // 마이페이지로
    } else if (requestURI.contains("/leaderboards")) {
      fallbackPage = "/leaderboards";  // 리더보드로
    }

    // Referer가 있고 유효한 경우 이전 페이지로, 없으면 fallback 페이지로
    return "redirect:" + (referer != null && !referer.isEmpty() ? referer : fallbackPage);
  }

  /**
   * 파일 크기를 사용자 친화적인 형태로 변환
   *
   * @param bytes 바이트 크기
   * @return 변환된 크기 문자열 (예: "10.5 MB")
   */
  private String formatFileSize(long bytes) {
    if (bytes < 1024) {
      return bytes + " B";
    } else if (bytes < 1024 * 1024) {
      return String.format("%.1f KB", bytes / 1024.0);
    } else {
      return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
  }
}