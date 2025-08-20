package org.hh.heritagehunters.domain.oauth.service;

import jakarta.transaction.Transactional;
import java.io.File;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.UnauthorizedException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.oauth.repository.UserRepository;
import org.hh.heritagehunters.domain.post.service.S3Service;
import org.hh.heritagehunters.domain.profile.dto.ProfileUpdateRequestDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserFacade {

  private final UserRepository userRepository;
  private final S3Service s3Service;

  @Transactional
  public User updateProfile(Long targetUserId,
      User currentUser,
      ProfileUpdateRequestDto dto,
      MultipartFile profileImage) {

    if (!targetUserId.equals(currentUser.getId())) {
      throw new UnauthorizedException(ErrorCode.OWNER_ONLY);
    }

    User user = userRepository.findById(targetUserId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

    // 닉네임/소개 수정
    if (dto.getNickname() != null) {
      user.setNickname(dto.getNickname());
    }
    if (dto.getBio() != null) {
      user.setBio(dto.getBio());
    }

    // 프로필 이미지 수정
    if (profileImage != null && !profileImage.isEmpty()) {
      File tempFile = null;
      try {
        // 기존 프로필 이미지 삭제
        if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
          try {
            String oldKey = s3Service.extractKeyFromUrl(user.getProfileImage());
            s3Service.deleteFile(oldKey);
            log.info("기존 프로필 이미지 삭제 완료: {}", oldKey);
          } catch (Exception e) {
            log.warn("기존 프로필 이미지 삭제 실패: {}", e.getMessage());
          }
        }

        // 신규 업로드
        tempFile = File.createTempFile("profile-", Objects.requireNonNull(profileImage.getOriginalFilename()));
        profileImage.transferTo(tempFile);

        String key = "users/" + user.getId() + "/profile/" + tempFile.getName();
        s3Service.uploadFile(key, tempFile);

        String imageUrl = s3Service.getFileUrl(key);
        user.setProfileImage(imageUrl);

      } catch (Exception e) {
        log.warn("프로필 이미지 업로드 실패: {}", e.getMessage());
      } finally {
        if (tempFile != null && tempFile.exists()) {
          if (!tempFile.delete()) {
            log.debug("임시 파일 삭제 실패: {}", tempFile.getAbsolutePath());
          }
        }
      }
    }

    return userRepository.save(user);
  }
}
