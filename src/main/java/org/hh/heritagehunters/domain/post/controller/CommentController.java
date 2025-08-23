package org.hh.heritagehunters.domain.post.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.hh.heritagehunters.domain.post.service.CommentService;
import org.hh.heritagehunters.domain.post.dto.request.CommentCreateRequestDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
public class CommentController {

  private final CommentService commentService;

  @PostMapping("/{postId}/comments")
  public String createComment(
      @PathVariable Long postId,
      @AuthenticationPrincipal CustomUserDetails currentUserDetails,
      @Valid @ModelAttribute CommentCreateRequestDto commentForm,
      BindingResult bindingResult,
      RedirectAttributes redirectAttributes,
      HttpServletRequest request) {

    if (currentUserDetails == null || currentUserDetails.getUser() == null) {
      throw new UnauthorizedException(ErrorCode.LOGIN_REQUIRED);
    }

    if (bindingResult.hasErrors()) {
      // AJAX 요청인 경우 상태 코드로 에러 전달
      if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
        throw new BadRequestException(ErrorCode.INVALID_INPUT_VALUE);
      }
      return redirectWithError(redirectAttributes, "댓글 내용을 입력해주세요.", "/posts");
    }

    commentService.add(postId, currentUserDetails.getUser(), commentForm);

    // AJAX 요청인 경우 성공 응답
    if (isAjaxRequest(request)) {
      return "features/post/empty"; // 빈 뷰 반환하여 SPA처럼 동작
    }

    return redirectWithSuccess(redirectAttributes, "댓글이 등록되었습니다.", "/posts");
  }

  private boolean isAjaxRequest(HttpServletRequest request) {
    return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
  }

  private String redirectWithToast(RedirectAttributes redirectAttributes, String type,
      String message, String path) {
    redirectAttributes.addFlashAttribute("toastType", type);
    redirectAttributes.addFlashAttribute("toastMessage", message);
    return "redirect:" + path;
  }

  private String redirectWithSuccess(RedirectAttributes redirectAttributes, String message,
      String path) {
    return redirectWithToast(redirectAttributes, "success", message, path);
  }

  private String redirectWithError(RedirectAttributes redirectAttributes, String message,
      String path) {
    return redirectWithToast(redirectAttributes, "error", message, path);
  }
}