package org.hh.heritagehunters.domain.profile.service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.post.repository.PostRepository;
import org.hh.heritagehunters.domain.profile.dto.ProfileHeaderDto;
import org.hh.heritagehunters.domain.profile.dto.StampItemDto;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository.StampProjection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileQueryService {

  private final UserRepository userRepository;
  private final HeritageRepository heritageRepository;
  private final PostRepository postRepository;

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
    List<StampProjection> all = heritageRepository.findAllForStamp();

    Set<Long> obtained = new HashSet<>(postRepository.findDistinctHeritageIdsByUserId(userId));

    Map<Long, LocalDateTime> obtainedAt = postRepository.findFirstObtainedAtByHeritage(userId)
        .stream()
        .collect(Collectors.toMap(
            r -> (Long) r[0],
            r -> (LocalDateTime) r[1]
        ));

    return all.stream()
        .map(h -> new StampItemDto(
            h.getId(),
            h.getName(),
            h.getThumbnailUrl(),
            obtained.contains(h.getId()),
            obtainedAt.get(h.getId())
        ))
        .toList();
  }
}
