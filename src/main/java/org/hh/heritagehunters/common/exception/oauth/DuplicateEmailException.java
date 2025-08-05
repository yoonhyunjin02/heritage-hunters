package org.hh.heritagehunters.common.exception.oauth;

import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;

public class DuplicateEmailException extends BadRequestException {
  public DuplicateEmailException() {
    super(ErrorCode.DUPLICATE_EMAIL);
  }
}