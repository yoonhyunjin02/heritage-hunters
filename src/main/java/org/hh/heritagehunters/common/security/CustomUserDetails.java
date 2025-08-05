package org.hh.heritagehunters.common.security;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Spring Security의 인증 정보를 담는 클래스
 * 일반 로그인 및 향후 소셜 로그인 사용자까지 커버할 수 있도록 설계
 */
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

  private final User user;

  /**
   * 현재는 단일 권한만 부여
   * 향후 소셜 사용자와 구분 필요 시 권한 변경 가능
   */
  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"));
  }

  /**
   * Spring Security에서 사용하는 비밀번호
   * 소셜 로그인 사용자의 경우 null이거나 빈 문자열일 수 있음
   */
  @Override
  public String getPassword() {
    return user.getPassword(); // 일반 로그인 사용자만 비밀번호 있음
  }

  /**
   * Spring Security에서 사용자 이름 (식별자)로 사용하는 값
   * 여기선 이메일 사용
   */
  @Override
  public String getUsername() {
    return user.getEmail();
  }

  @Override public boolean isAccountNonExpired() { return true; }

  @Override public boolean isAccountNonLocked() { return true; }

  @Override public boolean isCredentialsNonExpired() { return true; }

  @Override public boolean isEnabled() { return true; }

  /**
   * 내부에서 User 엔티티 자체가 필요할 경우 접근할 수 있도록 getter 제공
   */
  public User getUser() {
    return this.user;
  }
}
