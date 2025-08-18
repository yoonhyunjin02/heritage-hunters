package org.hh.heritagehunters.domain.post.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hibernate.annotations.CreationTimestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "comments")
public class Comment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @Column(name = "content", nullable = false, length = 200)
  private String content;

  @Column(name = "created_at", nullable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;

  /**
   * 새로운 댓글을 생성합니다
   * @param user 댓글 작성자
   * @param post 댓글이 달릴 게시글
   * @param content 댓글 내용
   * @return 생성된 댓글 엔티티
   */
  public static Comment create(User user, Post post, String content) {
    Comment comment = new Comment();
    comment.setUser(user);
    comment.setPost(post);
    comment.setContent(content);
    return comment;
  }
}
