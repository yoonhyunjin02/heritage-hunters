package org.hh.heritagehunters.common.exception;

import lombok.Getter;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;

@Getter
public class BadRequestException extends RuntimeException{

  private final ErrorCode errorCode;

  public BadRequestException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
  }
}
