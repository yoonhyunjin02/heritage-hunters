package org.hh.heritagehunters.domain.oauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginDto {

  @NotBlank(message = "이메일을 입력해주세요.")
  @Email(message = "올바른 이메일 주소 형식으로 입력해주세요.")
  private String email;

  @NotBlank(message = "비밀번호를 입력해주세요.")
  private String password;
}