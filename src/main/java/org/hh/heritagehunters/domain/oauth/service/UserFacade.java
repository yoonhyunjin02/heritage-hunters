package org.hh.heritagehunters.domain.oauth.service;

import jakarta.transaction.Transactional;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.oauth.DuplicateNicknameException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.profile.dto.ProfileUpdateRequestDto;
import org.hh.heritagehunters.domain.post.service.ImageUploadService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import org.hh.heritagehunters.common.security.CustomUserDetails;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserFacade {

  private final UserRepository userRepository;
  private final ImageUploadService imageUploadService;

  public User updateProfile(Long targetUserId,
      User currentUser,
      ProfileUpdateRequestDto dto,
      MultipartFile profileImage) {

    if (!targetUserId.equals(currentUser.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }

    User user = userRepository.findById(targetUserId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

    // 닉네임 중복 체크 (변경 요청이 있고, 현재 닉네임과 다를 때만)
    if (dto.getNickname() != null && !Objects.equals(dto.getNickname(), user.getNickname())) {
      if (userRepository.existsByNickname(dto.getNickname())) {
        throw new DuplicateNicknameException();
      }
      user.setNickname(dto.getNickname());
    }

    // 한 줄 소개 변경
    if (dto.getBio() != null) {
      user.setBio(dto.getBio());
    }

    // 프로필 이미지 변경
    if (profileImage != null && !profileImage.isEmpty()) {
      // 기존 이미지 삭제 (있을 경우)
      if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
        try {
          imageUploadService.deleteImage(user.getProfileImage());
          log.info("기존 프로필 이미지 삭제 완료: {}", user.getProfileImage());
        } catch (Exception e) {
          log.warn("기존 프로필 이미지 삭제 실패: {}", e.getMessage());
        }
      }
      // 신규 업로드
      String newImageUrl = imageUploadService.uploadImage(profileImage);
      user.setProfileImage(newImageUrl);
    }

    // 저장
    User updated = userRepository.save(user);

// 저장 직후 Authentication 갱신
    var ctx = SecurityContextHolder.getContext();
    var cur = ctx.getAuthentication();
    if (cur != null && cur.getPrincipal() instanceof CustomUserDetails cud) {
      Map<String, Object> attrs = cud.getAttributes(); // 소셜이면 존재, 로컬이면 null
      CustomUserDetails fresh = (attrs != null)
          ? new CustomUserDetails(updated, attrs)
          : new CustomUserDetails(updated);

      AbstractAuthenticationToken newAuth =
          (cur instanceof OAuth2AuthenticationToken oat)
              ? new OAuth2AuthenticationToken(fresh, cur.getAuthorities(), oat.getAuthorizedClientRegistrationId())
              : new UsernamePasswordAuthenticationToken(fresh, cur.getCredentials(), cur.getAuthorities());

      if (cur.getDetails() != null) newAuth.setDetails(cur.getDetails());
      ctx.setAuthentication(newAuth);
    }
    return updated;
  }
}