package org.hh.heritagehunters.domain.post.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hibernate.annotations.CreationTimestamp;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "posts")
public class Post {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "heritage_id", nullable = false)
  private Heritage heritage;

  @Column(name = "content", nullable = false, length = 200)
  private String content;

  @Column(name = "location", nullable = false, length = 50)
  private String location;

  @Column(name = "created_at", nullable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;

  @Column(name = "view_count", nullable = false)
  private Integer viewCount = 0;

  @Column(name = "comment_count", nullable = false)
  private Integer commentCount = 0;

  @Column(name = "like_count", nullable = false)
  private Integer likeCount = 0;

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PostImage> images = new ArrayList<>();

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Comment> comments = new ArrayList<>();

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  @ToString.Exclude
  private List<Like> likes = new ArrayList<>();

  // 비즈니스 메서드

  /**
   * Post 객체 생성(정적 메소드 팩토리)
   */
  public static Post create(User user, Heritage heritage, String content, String location) {
    Post post = new Post();
    post.user = user;
    post.heritage = heritage;
    post.content = content;
    post.location = location;
    return post;
  }

  /**
   * 조회수 증가
   */
  public void incrementViewCount() {
    this.viewCount++;
  }

  /**
   * 좋아요 수 증가
   */
  public void incrementLikeCount() {
    this.likeCount++;
  }

  /**
   * 좋아요 수 감소
   */
  public void decrementLikeCount() {
    if (this.likeCount > 0) {
      this.likeCount--;
    }
  }

  /**
   * 댓글 수 동기화
   */
  public void syncCommentCount() {
    this.commentCount = this.comments.size();
  }

  /**
   * 메인 이미지 URL 반환
   */
  public String getMainImageUrl() {
    return images.stream()
        .filter(PostImage::isMainImage)// 첫 번째 이미지를 메인 이미지로 가정
        .findFirst()
        .map(PostImage::getUrl)
        .orElse(null);
  }
}