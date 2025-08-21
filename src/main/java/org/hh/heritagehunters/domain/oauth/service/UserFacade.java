package org.hh.heritagehunters.domain.oauth.service;

import jakarta.transaction.Transactional;
import java.util.Objects;
import java.io.File;
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

    return userRepository.save(user);
  }
}