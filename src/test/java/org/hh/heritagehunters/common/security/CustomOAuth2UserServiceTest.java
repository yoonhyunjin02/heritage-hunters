package org.hh.heritagehunters.common.security;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * 서비스 코드는 수정하지 않고 테스트만으로 super.loadUser(...) 네트워크 호출을
 * JDK 내장 HttpServer로 대체한다. (WireMock 등 의존성 불필요)
 *
 * - Google: attributes { email, name, picture } 직접 옴
 * - Naver: attributes { response: { email, nickname/name, profile_image } }
 *
 * GitHub 분기는 fetchGithubEmail()이 외부 호출을 한 번 더 하므로
 * 서비스 코드를 건드리지 않는 한 테스트 난이도가 높다.
 * 여기서는 Google/Naver 시나리오로 핵심 로직을 충분히 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

  @Mock
  UserRepository userRepository;

  @InjectMocks
  CustomOAuth2UserService service; // 원본 서비스 그대로 사용

  private HttpServer server;
  private String baseUrl;

  @BeforeEach
  void startStubServer() throws IOException {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    baseUrl = "http://localhost:" + server.getAddress().getPort();
    server.start();
  }

  @AfterEach
  void stopStubServer() {
    if (server != null) server.stop(0);
  }

  /* ------------ helpers ------------- */

  private void stubUserInfo(String path, String jsonBody) {
    server.createContext(path, new HttpHandler() {
      @Override public void handle(HttpExchange exchange) throws IOException {
        byte[] bytes = jsonBody.getBytes();
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
          os.write(bytes);
        }
      }
    });
  }

  private static OAuth2AccessToken accessToken() {
    return new OAuth2AccessToken(
        OAuth2AccessToken.TokenType.BEARER,
        "dummy-token",
        Instant.now().minusSeconds(60),
        Instant.now().plusSeconds(3600)
    );
  }

  private ClientRegistration googleReg(String userInfoUri) {
    // DefaultOAuth2UserService는 userInfoUri와 userNameAttributeName만 쓰지만
    // Builder 제약상 auth/token/redirectUri도 채워준다.
    return ClientRegistration.withRegistrationId("google")
        .clientId("client-id")
        .clientSecret("secret")
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("{baseUrl}/login/oauth2/code/google")
        .authorizationUri(baseUrl + "/oauth2/auth")
        .tokenUri(baseUrl + "/oauth2/token")
        .userInfoUri(userInfoUri)
        .userNameAttributeName("sub")
        .scope("email", "profile")
        .build();
  }

  private ClientRegistration naverReg(String userInfoUri) {
    return ClientRegistration.withRegistrationId("naver")
        .clientId("client-id")
        .clientSecret("secret")
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("{baseUrl}/login/oauth2/code/naver")
        .authorizationUri(baseUrl + "/oauth2/auth")
        .tokenUri(baseUrl + "/oauth2/token")
        .userInfoUri(userInfoUri)
        // 네이버는 보통 "id"가 userNameAttributeName 역할
        .userNameAttributeName("id")
        .scope("name", "email")
        .build();
  }

  /* --------------- tests --------------- */

  @Test
  @DisplayName("google 신규가입: userInfo 응답 → DB에 새 사용자 저장, CustomUserDetails 반환")
  void google_newUser_created() {
    // 1) userInfo 응답 스텁
    String path = "/userinfo-google";
    stubUserInfo(path, """
      {
        "sub": "123456",
        "email": "a@example.com",
        "name": "Alice",
        "picture": "https://img/ava.png"
      }
      """);

    ClientRegistration reg = googleReg(baseUrl + path);
    OAuth2UserRequest req = new OAuth2UserRequest(reg, accessToken());

    // 2) DB: 없으면 저장
    when(userRepository.findByEmail("a@example.com")).thenReturn(Optional.empty());
    when(userRepository.existsByNickname("Alice")).thenReturn(false);
    // save는 전달된 엔티티를 그대로 반환
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    // 3) when
    OAuth2User oauth2User = service.loadUser(req);

    // 4) then
    assertThat(oauth2User).isInstanceOf(CustomUserDetails.class);
    // OAuth2User 인터페이스로 attributes 검증
    assertThat(oauth2User.getAttributes())
        .containsEntry("email", "a@example.com")
        .containsEntry("name", "Alice")
        .containsEntry("picture", "https://img/ava.png");

    // 저장된 값 검증
    ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(saved.capture());

    User u = saved.getValue();
    assertThat(u.getEmail()).isEqualTo("a@example.com");
    assertThat(u.getNickname()).isEqualTo("Alice");
    assertThat(u.getProfileImage()).isEqualTo("https://img/ava.png");
    assertThat(u.getProvider()).isEqualTo("google");
    assertThat(u.getScore()).isEqualTo(0);

    verify(userRepository).findByEmail("a@example.com");
    verify(userRepository).existsByNickname("Alice");
    verifyNoMoreInteractions(userRepository);
  }

  @Test
  @DisplayName("google 기존회원: userInfo 응답 → DB 저장 없이 기존 사용자로 반환")
  void google_existingUser_used() {
    // 1) userInfo 응답
    String path = "/userinfo-google2";
    stubUserInfo(path, """
      {
        "sub": "999",
        "email": "old@example.com",
        "name": "Old",
        "picture": "p"
      }
      """);

    ClientRegistration reg = googleReg(baseUrl + path);
    OAuth2UserRequest req = new OAuth2UserRequest(reg, accessToken());

    // 2) 기존 유저 존재
    User existing = new User();
    existing.setEmail("old@example.com");
    existing.setNickname("Old");
    existing.setProfileImage("p");
    existing.setProvider("google");
    when(userRepository.findByEmail("old@example.com")).thenReturn(Optional.of(existing));

    // 3) when
    OAuth2User oauth2User = service.loadUser(req);

    // 4) then: 저장 호출 없고, 기존 사용자 사용
    verify(userRepository).findByEmail("old@example.com");
    verifyNoMoreInteractions(userRepository);

    assertThat(oauth2User).isInstanceOf(CustomUserDetails.class);
    assertThat(oauth2User.getAttributes()).containsEntry("email", "old@example.com");
  }

  @Test
  @DisplayName("naver 신규가입: response 래퍼 안의 정보로 매핑")
  void naver_newUser_created() {
    // 1) naver 형태의 userInfo 응답
    String path = "/userinfo-naver";
    stubUserInfo(path, """
      {
        "id": "abc",
        "resultcode":"00",
        "message":"success",
        "response": {
          "id": "abc",
          "email": "n@example.com",
          "nickname": "네이버닉",
          "name": "네이버이름",
          "profile_image": "https://naver/img.png"
        }
      }
      """);

    ClientRegistration reg = naverReg(baseUrl + path);
    OAuth2UserRequest req = new OAuth2UserRequest(reg, accessToken());

    when(userRepository.findByEmail("n@example.com")).thenReturn(Optional.empty());
    // 닉네임 우선순위: nickname > name > "naver_user"
    when(userRepository.existsByNickname("네이버닉")).thenReturn(false);
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    OAuth2User oauth2User = service.loadUser(req);

    assertThat(oauth2User).isInstanceOf(CustomUserDetails.class);
    // 서비스는 attributes를 response로 교체해 반환한다.
    Map<String, Object> attrs = oauth2User.getAttributes();
    assertThat(attrs)
        .containsEntry("email", "n@example.com")
        .containsEntry("nickname", "네이버닉")
        .containsEntry("profile_image", "https://naver/img.png");

    ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(saved.capture());

    User u = saved.getValue();
    assertThat(u.getEmail()).isEqualTo("n@example.com");
    assertThat(u.getNickname()).isEqualTo("네이버닉");
    assertThat(u.getProfileImage()).isEqualTo("https://naver/img.png");
    assertThat(u.getProvider()).isEqualTo("naver");

    verify(userRepository).findByEmail("n@example.com");
    verify(userRepository).existsByNickname("네이버닉");
    verifyNoMoreInteractions(userRepository);
  }
}
