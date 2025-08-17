package org.hh.heritagehunters.common.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistration.Builder;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

  @Mock
  UserRepository userRepository;

  @Mock
  RestTemplate restTemplate;

  // ObjectMapper는 실제 인스턴스를 쓰는 것이 편합니다(파싱 검증).
  ObjectMapper objectMapper = new ObjectMapper();

  // 실제 서비스 인스턴스를 스파이로 감싸서 fetchFromProvider만 바꿔치기
  @Spy
  CustomOAuth2UserService service;

  @BeforeEach
  void setUp() {
    service = spy(new CustomOAuth2UserService(userRepository, restTemplate, objectMapper));
  }

  // ---------- Helpers ----------

  private ClientRegistration registration(String id, String userNameAttribute) {
    Builder b = ClientRegistration.withRegistrationId(id);
    return b.clientId("client-id")
        .clientSecret("secret")
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("http://localhost/login/oauth2/code/{registrationId}")
        .scope("read", "email", "profile")
        .authorizationUri("https://example.com/oauth/authorize")
        .tokenUri("https://example.com/oauth/token")
        .userInfoUri("https://example.com/userinfo")
        .userNameAttributeName(userNameAttribute)
        .build();
  }

  private OAuth2UserRequest requestFor(String registrationId, String userNameAttribute, String tokenValue) {
    ClientRegistration reg = registration(registrationId, userNameAttribute);
    OAuth2AccessToken token = new OAuth2AccessToken(
        OAuth2AccessToken.TokenType.BEARER,
        tokenValue,
        Instant.now().minusSeconds(60),
        Instant.now().plusSeconds(3600));
    return new OAuth2UserRequest(reg, token);
  }

  // ---------- Tests ----------

  @Test
  @DisplayName("Google: 신규 사용자면 저장 후 CustomUserDetails(OAuth2User) 반환")
  void loadUser_google_createsNewUser_whenNotExists() {
    // given: Provider에서 내려온 속성
    Map<String, Object> attrs = new HashMap<>();
    attrs.put("email", "g@example.com");
    attrs.put("name", "GName");
    attrs.put("picture", "https://img.example.com/p.png");

    OAuth2User providerUser = new DefaultOAuth2User(
        Set.of(new SimpleGrantedAuthority("ROLE_USER")),
        attrs,
        "email" // nameAttributeKey
    );
    doReturn(providerUser)
        .when(service)
        .fetchFromProvider(any(OAuth2UserRequest.class));

    when(userRepository.findByEmail("g@example.com")).thenReturn(java.util.Optional.empty());
    when(userRepository.existsByNickname("GName")).thenReturn(false);

    // save 시 그대로 객체를 반환
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0, User.class));

    OAuth2UserRequest req = requestFor("google", "email", "token-google");

    // when
    OAuth2User result = service.loadUser(req);

    // then
    assertNotNull(result);
    assertEquals("https://img.example.com/p.png", result.getAttributes().get("picture"));

    // 저장된 유저 검증
    ArgumentCaptor<User> userCap = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCap.capture());
    User saved = userCap.getValue();
    assertEquals("g@example.com", saved.getEmail());
    assertEquals("GName", saved.getNickname());
    assertEquals("google", saved.getProvider());

    verify(userRepository).findByEmail("g@example.com");
    verify(userRepository).existsByNickname("GName");
    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("GitHub: /user/emails에서 primary+verified 이메일을 찾아 기존 사용자 반환(신규 저장 안 함)")
  void loadUser_github_fetchesPrimaryEmail_andReturnsExistingUser() {
    // given
    Map<String, Object> attrs = new HashMap<>();
    attrs.put("login", "octocat");
    attrs.put("name", "Octo Cat");
    attrs.put("avatar_url", "https://avatars.example.com/octo.png");

    OAuth2User providerUser = new DefaultOAuth2User(
        Set.of(new SimpleGrantedAuthority("ROLE_USER")),
        attrs,
        "login"
    );
    doReturn(providerUser)
        .when(service)
        .fetchFromProvider(any(OAuth2UserRequest.class));

    // GitHub 이메일 API 응답
    String json = """
        [
          {"email":"other@ex.com","primary":false,"verified":true},
          {"email":"octo@ex.com","primary":true,"verified":true}
        ]
        """;
    when(restTemplate.exchange(
        anyString(),
        any(HttpMethod.class),
        any(HttpEntity.class),
        eq(String.class)
    )).thenReturn(ResponseEntity.ok(json));

    User existed = new User();
    existed.setId(10L);
    existed.setEmail("octo@ex.com");
    existed.setNickname("Octo Cat");
    existed.setProvider("github");

    when(userRepository.findByEmail("octo@ex.com")).thenReturn(java.util.Optional.of(existed));

    OAuth2UserRequest req = requestFor("github", "login", "token-gh");

    // when
    OAuth2User result = service.loadUser(req);

    // then
    assertNotNull(result);
    // 신규 저장 안 함
    verify(userRepository, never()).save(any());
    verify(userRepository).findByEmail("octo@ex.com");
    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("Naver: response.nickname이 비어있으면 name 사용, 그마저 없으면 'naver_user'")
  void loadUser_naver_usesNicknameFallbacks() {
    // given
    Map<String, Object> response = new HashMap<>();
    response.put("email", "n@ex.com");
    response.put("nickname", ""); // 빈 → fallback
    response.put("name", "홍길동");
    response.put("profile_image", "https://img.naver.com/p.png");

    Map<String, Object> attrs = Map.of("response", response);

    OAuth2User providerUser = new DefaultOAuth2User(
        Set.of(new SimpleGrantedAuthority("ROLE_USER")),
        attrs,
        "ignored" // 실제로는 쓰지 않음
    );
    doReturn(providerUser)
        .when(service)
        .fetchFromProvider(any(OAuth2UserRequest.class));

    when(userRepository.findByEmail("n@ex.com")).thenReturn(java.util.Optional.empty());
    when(userRepository.existsByNickname("홍길동")).thenReturn(false);
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0, User.class));

    OAuth2UserRequest req = requestFor("naver", "id", "token-naver");

    // when
    OAuth2User result = service.loadUser(req);

    // then
    assertNotNull(result);

    // 저장된 유저의 닉네임이 '홍길동'으로 결정되었는지 확인
    ArgumentCaptor<User> userCap = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCap.capture());
    User saved = userCap.getValue();
    assertEquals("n@ex.com", saved.getEmail());
    assertEquals("홍길동", saved.getNickname());
    assertEquals("naver", saved.getProvider());

    verify(userRepository).findByEmail("n@ex.com");
    verify(userRepository).existsByNickname("홍길동");
    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("이메일을 얻지 못하면 OAuth2AuthenticationException 발생")
  void loadUser_throws_whenEmailMissing() {
    // given: GitHub이지만 /user/emails에서 primary+verified가 없음
    Map<String, Object> attrs = Map.of(
        "login", "noemail",
        "name", "No Email",
        "avatar_url", "https://avatars.example.com/no.png"
    );
    OAuth2User providerUser = new DefaultOAuth2User(
        Set.of(new SimpleGrantedAuthority("ROLE_USER")),
        attrs,
        "login"
    );
    doReturn(providerUser)
        .when(service)
        .fetchFromProvider(any(OAuth2UserRequest.class));

    String json = """
        [
          {"email":"x@ex.com","primary":false,"verified":true},
          {"email":"y@ex.com","primary":true,"verified":false}
        ]
        """;
    when(restTemplate.exchange(
        anyString(),
        any(HttpMethod.class),
        any(HttpEntity.class),
        eq(String.class)
    )).thenReturn(ResponseEntity.ok(json));

    OAuth2UserRequest req = requestFor("github", "login", "token-gh-missing");

    // when / then
    assertThrows(OAuth2AuthenticationException.class, () -> service.loadUser(req));

    // 저장 로직 호출되지 않아야 함
    verify(userRepository, never()).save(any());
    verifyNoMoreInteractions(userRepository);
  }
}
