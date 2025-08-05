package org.hh.heritagehunters.common.exception;

import lombok.Getter;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;

@Getter
public class InternalServerErrorException extends RuntimeException{

  private final ErrorCode errorCode;

  public InternalServerErrorException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
  }
}
