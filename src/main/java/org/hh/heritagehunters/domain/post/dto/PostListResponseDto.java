package org.hh.heritagehunters.domain.post.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.hh.heritagehunters.domain.post.entity.Post;

@Getter
@Builder
public class PostListResponseDto {

  private Long id;
  private String content;
  private String location;
  private LocalDateTime createdAt;
  private int viewCount;
  private int likeCount;
  private int commentCount;

  private boolean likedByCurrentUser;

  // 문화유산 정보
  private HeritageInfo heritage;

  // 작성자 정보
  private UserInfo user;

  // 이미지들
  private List<String> images;

  private String mainImageUrl;

  @Getter
  @Builder
  public static class HeritageInfo {
    private Long id;
    private String name;
    private String designation;
  }

  @Getter
  @Builder
  public static class UserInfo {
    private Long id;
    private String nickname;
    private String profileImage;
  }

  public static PostListResponseDto from(Post post, boolean likedByCurrentUser) {
    return PostListResponseDto.builder()
        .id(post.getId())
        .content(post.getContent())
        .location(post.getLocation())
        .createdAt(post.getCreatedAt())
        .viewCount(post.getViewCount())
        .likeCount(post.getLikeCount())
        .commentCount(post.getCommentCount())
        .likedByCurrentUser(likedByCurrentUser)

        .heritage(post.getHeritage() != null ? HeritageInfo.builder()
            .id(post.getHeritage().getId())
            .name(post.getHeritage().getName())
            .designation(post.getHeritage().getDesignation())
            .build() : null)

        .user(UserInfo.builder()
            .id(post.getUser().getId())
            .nickname(post.getUser().getNickname())
            .profileImage(post.getUser().getProfileImage())
            .build())

        .images(post.getImages().stream()
            .map(image -> image.getUrl())
            .toList())
        .mainImageUrl(post.getImages().isEmpty() ? null : post.getImages().get(0).getUrl())
        .build();
  }
}