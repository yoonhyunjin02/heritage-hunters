package org.hh.heritagehunters.domain.profile.service;

import java.util.*;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.profile.dto.ProfileHeaderDto;
import org.hh.heritagehunters.domain.profile.dto.StampItemDto;
import org.hh.heritagehunters.domain.profile.repository.UserStampRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileQueryService {

  private final UserRepository userRepository;
  private final UserStampRepository userStampRepository;

  public ProfileHeaderDto getHeader(Long userId) {
    User u = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
    return new ProfileHeaderDto(
        u.getId(),
        u.getNickname(),
        u.getEmail(),
        u.getProfileImage(),
        u.getScore()
    );
  }

  public List<StampItemDto> getStamps(Long userId) {
    return userStampRepository.findObtainedStamps(userId).stream()
        .map(p -> new StampItemDto(
            p.getId(),
            p.getName(),
            p.getThumbnailUrl(),
            true,                 // 어차피 얻은 목록만 오므로 항상 true
            p.getEarnedAt()
        ))
        .toList();
  }
}
