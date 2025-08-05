package org.hh.heritagehunters.common.exception.oauth;

import org.hh.heritagehunters.common.exception.BadRequestException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;

public class LoginFailedException extends BadRequestException {
  public LoginFailedException() {
    super(ErrorCode.INVALID_CREDENTIALS);
  }
}