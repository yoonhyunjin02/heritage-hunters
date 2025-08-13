package org.hh.heritagehunters.common.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  private final CustomOAuth2UserService customOAuth2UserService;

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
                "/",
                "/main",
                "/register",
                "/login",
                "/logout",

                // static resource allowlist
                "/css/**",
                "/js/**",
                "/images/**",
                "/common/**",
                "/features/**",
                "/favicon.ico"
            ).permitAll()
            .anyRequest().authenticated()
        )
        .formLogin(form -> form
            .loginPage("/login")
            .usernameParameter("email")
            .loginProcessingUrl("/login")
            .defaultSuccessUrl("/main", true)
            .failureHandler(new CustomAuthenticationFailureHandler())
            .permitAll()
        )
        .oauth2Login(oauth2 -> oauth2
            .loginPage("/login")
            .userInfoEndpoint(userInfo -> userInfo
                .userService(customOAuth2UserService)
            )
            .failureHandler((request, response, exception) -> {
              exception.printStackTrace(); // 개발 중 디버깅
              String message = exception.getMessage();
              if (message == null || message.trim().isEmpty()) {
                message = "알 수 없는 오류가 발생했습니다.";
              }
              String encodedMessage = java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8);
              response.sendRedirect("/login?error=" + encodedMessage);
            })
            .defaultSuccessUrl("/main", true)
        )
        .logout(logout -> logout
            .logoutSuccessUrl("/login?logout")
            .permitAll()
        )
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
        );

    return http.build();
  }

  @Bean
  public DaoAuthenticationProvider daoAuthenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder);

    // 이메일이 없을 경우에도 UsernameNotFoundException 유지
    provider.setHideUserNotFoundExceptions(false);

    return provider;
  }

}