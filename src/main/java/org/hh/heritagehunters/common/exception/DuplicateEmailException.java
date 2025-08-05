package org.hh.heritagehunters.common.exception;

import org.hh.heritagehunters.common.exception.payload.ErrorCode;

public class DuplicateEmailException extends BadRequestException {
  public DuplicateEmailException() {
    super(ErrorCode.DUPLICATE_EMAIL);
  }
}
