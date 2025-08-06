package org.hh.heritagehunters.common.security;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private final UserRepository userRepository;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);

    String registrationId = userRequest.getClientRegistration().getRegistrationId(); // "google"
    Map<String, Object> attributes = oAuth2User.getAttributes();

    String email = (String) attributes.get("email");
    String name = (String) attributes.get("name");
    String picture = (String) attributes.get("picture");

    // 유저 조회 or 생성
    User user = userRepository.findByEmail(email)
        .orElseGet(() -> {
          String safeNickname = generateUniqueNickname(name);
          User newUser = new User();
          newUser.setEmail(email);
          newUser.setNickname(safeNickname);
          newUser.setPassword(null); // 비번 없는 소셜 계정
          newUser.setProfile_image(picture);
          newUser.setScore(0);
          newUser.setBio(null);
          newUser.setProvider(registrationId);
          return userRepository.save(newUser);
        });

    return new DefaultOAuth2User(
        Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
        attributes,
        "email" // 사용자 고유 키로 사용할 필드
    );
  }

  // 닉네임 중복 방지 (단순 UUID 기반, 너의 정책에 맞게 수정 가능)
  private String generateUniqueNickname(String base) {
    String nickname = base;
    int count = 0;
    while (userRepository.existsByNickname(nickname)) {
      count++;
      nickname = base + "_" + UUID.randomUUID().toString().substring(0, 6);
    }
    return nickname;
  }
}
