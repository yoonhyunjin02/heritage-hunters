package org.hh.heritagehunters.common.exception.oauth;

import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;

public class DuplicateNicknameException extends BadRequestException {
  public DuplicateNicknameException() {
    super(ErrorCode.DUPLICATE_NICKNAME);
  }
}
