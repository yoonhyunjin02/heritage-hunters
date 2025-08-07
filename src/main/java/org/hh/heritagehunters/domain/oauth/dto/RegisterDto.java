package org.hh.heritagehunters.domain.oauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterDto {

  @Email(message = "올바른 이메일 주소 형식으로 입력해주세요.")
  @NotBlank(message = "이메일을 입력해주세요.")
  private String email;

  @NotBlank(message = "닉네임을 입력해주세요.")
  @Size(min = 2, max = 12, message = "닉네임은 2자 이상 12자 이하로 입력해주세요.")
  private String nickname;

  @NotBlank(message = "비밀번호를 입력해주세요.")
  @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
  @Pattern(
      regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,20}$",
      message = "비밀번호는 영문, 숫자, 특수문자(@$!%*?&)를 포함하여 20자이내여야 합니다."
  )
  private String password;

  @NotBlank(message = "비밀번호 확인을 입력해주세요.")
  private String passwordConfirm;
}