package org.hh.heritagehunters.common.security;

import java.util.Map;
import lombok.Getter;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Spring Security의 인증 정보를 담는 클래스
 * 일반 로그인 및 향후 소셜 로그인 사용자까지 커버할 수 있도록 설계
 */
@Getter
public class CustomUserDetails implements UserDetails, OAuth2User {

  private final User user;
  private final Map<String, Object> attributes;

  public CustomUserDetails(User user) {
    this.user = user;
    this.attributes = null;
  }

  public CustomUserDetails(User user, Map<String, Object> attributes) {
    this.user = user;
    this.attributes = attributes;
  }

  @Override
  public Map<String, Object> getAttributes() {
    return attributes;
  }

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
    return user.getPassword();
  }

  /**
   * Spring Security에서 사용자 이름 (식별자)로 사용하는 값
   * 여기선 이메일 사용
   */
  @Override
  public String getUsername() {
    return user.getEmail();
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }

  /**
   * profile 페이지는 user id로 접근
   */
  public Long getId() {
    return user.getId();
  }

  /**
   * Thymeleaf 헤더 등에서 사용자 닉네임 표시
   */
  public String getNickname() {
    return user.getNickname();
  }

  /**
   * Thymeleaf에서 프로필 이미지 표시 (없으면 null)
   */
  public String getProfileImage() {
    return user.getProfileImage();
  }

  @Override
  public String getName() {
    return user.getNickname(); // OAuth2User의 getName() 구현
  }
}