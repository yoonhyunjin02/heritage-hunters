package org.hh.heritagehunters.common.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private final UserRepository userRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    try {
      OAuth2User oAuth2User = super.loadUser(userRequest);
      String registrationId = userRequest.getClientRegistration().getRegistrationId();
      Map<String, Object> attributes = oAuth2User.getAttributes();

      System.out.println("OAuth2 attributes: " + attributes);

      String email = null;
      String name = null;
      String picture = null;

      if ("google".equals(registrationId)) {
        email = (String) attributes.get("email");
        name = (String) attributes.get("name");
        picture = (String) attributes.get("picture");

      } else if ("github".equals(registrationId)) {
        name = (String) attributes.get("name");
        if (name == null) name = (String) attributes.get("login");
        picture = (String) attributes.get("avatar_url");

        // GitHub의 /user/emails API를 사용 -> primary, verified인 이메일을 강제로 직접 요청
        // 비공개된 이메일도 받을 수 있음
        email = fetchGithubEmail(userRequest.getAccessToken().getTokenValue());

      } else if ("naver".equals(registrationId)) {
        Map<String, Object> response = (Map<String, Object>) attributes.get("response");

        email = (String) response.get("email");
        String rawNickname = (String) response.get("nickname");
        String rawName = (String) response.get("name");
        picture = (String) response.get("profile_image");

        // 닉네임 선택 우선순위: nickname > name > "naver_user"
        name = rawNickname != null && !rawNickname.isBlank() ? rawNickname
            : rawName != null && !rawName.isBlank() ? rawName
                : "naver_user";

        attributes = response;
      }

      if (email == null) {
        throw new OAuth2AuthenticationException(
            "로그인에 필요한 이메일 정보를 확인할 수 없습니다. " +
                "GitHub 계정에 인증된(primary, verified) 이메일이 등록되어 있는지 확인해 주세요.");
      }

      User user = userRepository.findByEmail(email).orElse(null);

      if (user == null) {
        String safeNickname = generateUniqueNickname(name);
        user = createNewUser(email, safeNickname, picture, registrationId);
      }

      Map<String, Object> modifiedAttributes = new HashMap<>(attributes);
      modifiedAttributes.put("email", email);

      return new DefaultOAuth2User(
          Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
          modifiedAttributes,
          "email"
      );

    } catch (OAuth2AuthenticationException e) {
      // 위에서 던진 이메일 예외 (메시지 그대로 전달)
      throw e;

    } catch (Exception e) {
      e.printStackTrace(); // 콘솔 출력은 개발 중 참고용
      throw new OAuth2AuthenticationException("소셜 로그인 중 문제가 발생했습니다.");
    }
  }

  private String generateUniqueNickname(String base) {
    String nickname = base;
    while (userRepository.existsByNickname(nickname)) {
      nickname = base + "_" + UUID.randomUUID().toString().substring(0, 6);
    }
    return nickname;
  }

  private User createNewUser(String email, String nickname, String picture, String provider) {
    User newUser = new User();
    newUser.setEmail(email);
    newUser.setNickname(nickname);
    newUser.setPassword(null);
    newUser.setProfileImage(picture);
    newUser.setScore(0);
    newUser.setBio(null);
    newUser.setProvider(provider);
    return userRepository.save(newUser);
  }

  // GitHub 이메일 직접 요청
  private String fetchGithubEmail(String accessToken) {
    String emailEndpoint = "https://api.github.com/user/emails";

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    headers.setAccept(List.of(MediaType.APPLICATION_JSON));
    HttpEntity<String> entity = new HttpEntity<>(headers);

    RestTemplate restTemplate = new RestTemplate();
    ResponseEntity<String> response = restTemplate.exchange(
        emailEndpoint,
        HttpMethod.GET,
        entity,
        String.class
    );

    try {
      JsonNode emailNodes = objectMapper.readTree(response.getBody());
      for (JsonNode node : emailNodes) {
        if (node.get("primary").asBoolean() && node.get("verified").asBoolean()) {
          return node.get("email").asText();
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }

    return null;
  }
}