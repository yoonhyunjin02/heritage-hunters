package org.hh.heritagehunters.domain.profile.dto;

public record ProfileHeaderDto(
    Long userId,
    String nickname,
    String email,
    String bio,
    String profileImage,
    Integer score) {

}

