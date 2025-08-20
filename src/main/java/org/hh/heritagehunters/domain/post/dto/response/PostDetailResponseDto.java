package org.hh.heritagehunters.domain.post.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.post.dto.CommentDto;
import org.hh.heritagehunters.domain.post.dto.PostImageDto;
import org.hh.heritagehunters.domain.post.entity.Comment;
import org.hh.heritagehunters.domain.post.entity.Post;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDetailResponseDto {

  private Long id;
  private String content;
  private String location;
  private LocalDateTime createdAt;
  private Integer viewCount;
  private Integer commentCount;
  private Integer likeCount;

  // 작성자 정보
  private Long userId;
  private String userNickname;
  private String userProfileImage;

  // 문화유산 정보
  private Long heritageId;
  private String heritageName;
  private String heritageRegion;

  // 이미지 목록
  private List<PostImageDto> images;

  // 댓글 목록
  private List<CommentDto> comments;

  // 현재 사용자 관련
  private boolean isLiked;
  private boolean isOwner;

  public static PostDetailResponseDto from(Post post, boolean isLiked, boolean isOwner) {
    PostDetailResponseDto dto = new PostDetailResponseDto();

    dto.setId(post.getId());
    dto.setContent(post.getContent());
    dto.setLocation(post.getLocation());
    dto.setCreatedAt(post.getCreatedAt());
    dto.setViewCount(post.getViewCount());
    dto.setCommentCount(post.getCommentCount());
    dto.setLikeCount(post.getLikeCount());

    // 작성자 정보
    dto.setUserId(post.getUser().getId());
    dto.setUserNickname(post.getUser().getNickname());
    dto.setUserProfileImage(post.getUser().getProfileImage());

    // 문화유산 정보
    if (post.getHeritage() != null) {
      dto.setHeritageId(post.getHeritage().getId());
      dto.setHeritageName(post.getHeritage().getName());
      dto.setHeritageRegion(post.getHeritage().getRegion());
    }

    // 이미지 목록
    dto.setImages(post.getImages().stream()
        .map(PostImageDto::from)
        .toList());

    // 댓글 목록 (Post 엔티티의 댓글 사용)
    dto.setComments(post.getComments().stream()
        .map(CommentDto::from)
        .toList());

    dto.setLiked(isLiked);
    dto.setOwner(isOwner);

    return dto;
  }

  public static PostDetailResponseDto from(Post post, List<Comment> comments, boolean isLiked, boolean isOwner) {
    PostDetailResponseDto dto = new PostDetailResponseDto();

    dto.setId(post.getId());
    dto.setContent(post.getContent());
    dto.setLocation(post.getLocation());
    dto.setCreatedAt(post.getCreatedAt());
    dto.setViewCount(post.getViewCount());
    dto.setCommentCount(post.getCommentCount());
    dto.setLikeCount(post.getLikeCount());

    // 작성자 정보
    dto.setUserId(post.getUser().getId());
    dto.setUserNickname(post.getUser().getNickname());
    dto.setUserProfileImage(post.getUser().getProfileImage());

    // 문화유산 정보
    if (post.getHeritage() != null) {
      dto.setHeritageId(post.getHeritage().getId());
      dto.setHeritageName(post.getHeritage().getName());
      dto.setHeritageRegion(post.getHeritage().getRegion());
    }

    // 이미지 목록
    dto.setImages(post.getImages().stream()
        .map(PostImageDto::from)
        .toList());

    // 댓글 목록 (별도 조회된 댓글 사용)
    dto.setComments(comments.stream()
        .map(CommentDto::from)
        .toList());

    dto.setLiked(isLiked);
    dto.setOwner(isOwner);

    return dto;
  }
}