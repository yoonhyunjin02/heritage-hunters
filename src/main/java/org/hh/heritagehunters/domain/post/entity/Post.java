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
import java.awt.Image;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import javax.print.attribute.standard.MediaSize.NA;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.oauth.entity.User;
import org.hh.heritagehunters.domain.search.entity.Heritage;


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
  private LocalDateTime createdAt;

  @Column(name = "view_count", nullable = false)
  private Integer viewCount;

  @Column(name = "comment_count", nullable = false)
  private Integer commentCount;

  @Column(name = "like_count", nullable = false)
  private Integer likeCount;

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
  private List<PostImage> images = new ArrayList<>();

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Comment> comments = new ArrayList<>();

  @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Like> likes = new ArrayList<>();

  // 비즈니스 메서드

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