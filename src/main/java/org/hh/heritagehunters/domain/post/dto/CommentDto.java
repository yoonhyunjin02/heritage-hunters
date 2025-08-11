package org.hh.heritagehunters.domain.post.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.post.entity.Comment;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {

  private Long id;
  private String content;
  private LocalDateTime createdAt;
  private Long userId;
  private String userNickname;
  private String userProfileImage;

  public static CommentDto from(Comment comment) {
    return new CommentDto(
        comment.getId(),
        comment.getContent(),
        comment.getCreatedAt(),
        comment.getUser().getId(),
        comment.getUser().getNickname(),
        comment.getUser().getProfileImage()
    );
  }
}
