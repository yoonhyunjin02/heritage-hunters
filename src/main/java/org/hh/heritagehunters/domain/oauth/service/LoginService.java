package org.hh.heritagehunters.domain.oauth.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.dto.LoginDto;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.common.exception.oauth.LoginFailedException;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class LoginService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public User login(LoginDto dto) {
    User user = userRepository.findByEmail(dto.getEmail())
        .orElseThrow(LoginFailedException::new);

    if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
      throw new LoginFailedException();
    }

    return user;
  }
}
