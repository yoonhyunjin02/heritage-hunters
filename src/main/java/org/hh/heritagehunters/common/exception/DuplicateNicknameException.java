package org.hh.heritagehunters.common.exception;

import org.hh.heritagehunters.common.exception.payload.ErrorCode;

public class DuplicateNicknameException extends BadRequestException {
  public DuplicateNicknameException() {
    super(ErrorCode.DUPLICATE_NICKNAME);
  }
}
