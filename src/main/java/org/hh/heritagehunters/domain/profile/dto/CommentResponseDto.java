package org.hh.heritagehunters.domain.profile.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.hh.heritagehunters.domain.post.entity.Comment;

@Getter
@AllArgsConstructor(staticName = "from")
public class CommentResponseDto {
  private Long id;
  private String content;
  private String authorNickname;
  private String createdAt;

  public static CommentResponseDto from(Comment comment) {
    return new CommentResponseDto(
        comment.getId(),
        comment.getContent(),
        comment.getUser().getNickname(),
        comment.getCreatedAt().toString()
    );
  }
}
