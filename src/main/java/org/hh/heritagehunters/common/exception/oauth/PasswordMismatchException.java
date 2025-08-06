package org.hh.heritagehunters.common.exception.oauth;

import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;

public class PasswordMismatchException extends BadRequestException {
  public PasswordMismatchException() {
    super(ErrorCode.PASSWORD_MISMATCH);
  }
}
