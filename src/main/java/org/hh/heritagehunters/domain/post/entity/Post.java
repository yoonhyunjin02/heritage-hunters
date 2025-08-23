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
import org.hibernate.annotations.BatchSize;
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

  @Column(nullable = false, length = 200)
  private String content;

  @Column(nullable = false, length = 50)
  private String location;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private Integer viewCount = 0;

  @Column(nullable = false)
  private Integer commentCount = 0;

  @Column(nullable = false)
  private Integer likeCount = 0;

  @BatchSize(size = 100)
  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  @ToString.Exclude
  private List<PostImage> images = new ArrayList<>();

  @BatchSize(size = 100)
  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  @ToString.Exclude
  private List<Comment> comments = new ArrayList<>();

  @BatchSize(size = 100)
  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  @ToString.Exclude
  private List<Like> likes = new ArrayList<>();

  // 비즈니스 메서드

  /**
   * 새로운 게시글을 생성합니다
   * @param user 게시글 작성자
   * @param heritage 연결된 문화유산
   * @param content 게시글 내용
   * @param location 위치 정보
   * @return 생성된 게시글 엔티티
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
   * 게시글 조회수를 1 증가시킵니다
   */
  public void incrementViewCount() {
    this.viewCount++;
  }

  /**
   * 게시글 좋아요 수를 1 증가시킵니다
   */
  public void incrementLikeCount() {
    this.likeCount++;
  }

  /**
   * 게시글 좋아요 수를 1 감소시킵니다
   */
  public void decrementLikeCount() {
    if (this.likeCount > 0) {
      this.likeCount--;
    }
  }

  /**
   * 댓글 수를 실제 댓글 목록 크기와 동기화합니다
   */
  public void syncCommentCount() {
    this.commentCount = this.comments.size();
  }

  /**
   * 게시글의 메인 이미지 URL을 반환합니다 (orderIndex = 0 기준)
   * @return 메인 이미지 URL (없으면 null)
   */
  public String getMainImageUrl() {
    return images.stream()
        .filter(img -> img.getOrderIndex() == 0)
        .findFirst()
        .map(PostImage::getUrl)
        .orElse(null);
  }
}
