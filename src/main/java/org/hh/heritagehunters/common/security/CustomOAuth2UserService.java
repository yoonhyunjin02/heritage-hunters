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
    OAuth2User oAuth2User = super.loadUser(userRequest);

    String registrationId = userRequest.getClientRegistration().getRegistrationId(); // "google", "github"
    Map<String, Object> attributes = oAuth2User.getAttributes();
    System.out.println("GitHub attributes: " + attributes);

    String email = null;
    String name = null;
    String picture = null;

    if ("google".equals(registrationId)) {
      email = (String) attributes.get("email");
      name = (String) attributes.get("name");
      picture = (String) attributes.get("picture");
    } else if ("github".equals(registrationId)) {
      // 기본 정보
      name = (String) attributes.get("name");
      if (name == null) name = (String) attributes.get("login");
      picture = (String) attributes.get("avatar_url");

      // ➕ 이메일은 직접 호출해서 가져오기
      email = fetchGithubEmail(userRequest.getAccessToken().getTokenValue());
    }

    if (email == null) {
      throw new OAuth2AuthenticationException("이메일 정보를 받아올 수 없습니다.");
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
    newUser.setProfile_image(picture);
    newUser.setScore(0);
    newUser.setBio(null);
    newUser.setProvider(provider);
    return userRepository.save(newUser);
  }

  // 🔥 GitHub 이메일 직접 요청
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