package org.hh.heritagehunters.domain.post.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hibernate.annotations.CreationTimestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "likes")
@IdClass(LikeId.class)
public class Like {

  @Id
  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Id
  @Column(name = "post_id", nullable = false)
  private Long postId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id", insertable = false, updatable = false)
  private Post post;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", insertable = false, updatable = false)
  private User user;

  @Column(name = "created_at", nullable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;

  /**
   * 새로운 좋아요를 생성합니다
   * @param user 좋아요를 누른 사용자
   * @param post 좋아요가 눌린 게시글
   * @return 생성된 좋아요 엔티티
   */
  public static Like create(User user, Post post) {
    Like like = new Like();
    like.setUserId(user.getId());
    like.setPostId(post.getId());
    like.setPost(post);
    like.setUser(user);
    return like;
  }
}