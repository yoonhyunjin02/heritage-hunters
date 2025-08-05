package org.hh.heritagehunters.domain.oauth.service;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.oauth.dto.RegisterDto;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.common.exception.DuplicateEmailException;
import org.hh.heritagehunters.common.exception.DuplicateNicknameException;
import org.hh.heritagehunters.common.exception.PasswordMismatchException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class RegisterService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public void register(RegisterDto dto) {
    if (userRepository.existsByEmail(dto.getEmail())) {
      throw new DuplicateEmailException();
    }

    if (userRepository.existsByNickname(dto.getNickname())) {
      throw new DuplicateNicknameException();
    }

    if (!dto.getPassword().equals(dto.getPasswordConfirm())) {
      throw new PasswordMismatchException();
    }

    String encodedPassword = passwordEncoder.encode(dto.getPassword());

    User user = new User();
    user.setEmail(dto.getEmail());
    user.setNickname(dto.getNickname());
    user.setPassword(encodedPassword);

    userRepository.save(user);
  }
}
