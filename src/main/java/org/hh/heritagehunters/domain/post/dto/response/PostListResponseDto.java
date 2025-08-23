package org.hh.heritagehunters.domain.post.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.hh.heritagehunters.domain.post.entity.Post;

@Getter
@Builder
@Schema(name = "PostListResponseDto", description = "게시글 목록 응답")
public class PostListResponseDto {

  @Schema(description = "게시글 ID", example = "1")
  private Long id;
  @Schema(description = "게시글 내용", example = "경복궁에서 사진 찍었어요!")
  private String content;
  @Schema(description = "위치", example = "경복궁")
  private String location;
  @Schema(description = "작성일시", example = "2024-01-15T10:30:00")
  private LocalDateTime createdAt;
  @Schema(description = "조회수", example = "125")
  private int viewCount;
  @Schema(description = "좋아요 수", example = "15")
  private int likeCount;
  @Schema(description = "댓글 수", example = "3")
  private int commentCount;

  @Schema(description = "현재 사용자의 좋아요 여부", example = "true")
  private boolean likedByCurrentUser;

  @Schema(description = "문화유산 정보")
  private HeritageInfo heritage;

  @Schema(description = "작성자 정보")
  private UserInfo user;

  @Schema(description = "이미지 URL 목록")
  private List<String> images;

  @Schema(description = "메인 이미지 URL")
  private String mainImageUrl;

  @Getter
  @Builder
  @Schema(name = "HeritageInfo", description = "문화유산 정보")
  public static class HeritageInfo {
    @Schema(description = "문화유산 ID", example = "1")
    private Long id;
    @Schema(description = "문화유산 명", example = "경복궁")
    private String name;
    @Schema(description = "지정 사항", example = "사적 제122호")
    private String designation;
  }

  @Getter
  @Builder
  @Schema(name = "UserInfo", description = "사용자 정보")
  public static class UserInfo {
    @Schema(description = "사용자 ID", example = "1")
    private Long id;
    @Schema(description = "닉네임", example = "문화애호가")
    private String nickname;
    @Schema(description = "프로필 이미지 URL")
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

  /**
   * Service에서 미리 조회한 썸네일 URL을 주입하는 팩토리 메서드
   */
  public static PostListResponseDto fromEntityAndThumb(Post post, boolean likedByCurrentUser, String thumbnailUrl) {
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
        .mainImageUrl(thumbnailUrl)
        .build();
  }
}