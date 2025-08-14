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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "post_images")
public class PostImage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  @Column(name = "url", nullable = false, columnDefinition = "TEXT")
  private String url;

  @Column(name = "order_index", nullable = false)
  private Integer orderIndex;


  /**
   * 이 이미지가 메인 이미지인지 확인합니다
   * @return 메인 이미지 여부 (orderIndex가 0이면 true)
   */
  public boolean isMainImage() {
    return orderIndex != null && orderIndex == 0;
  }

  /**
   * 이미지의 순서를 업데이트합니다
   * @param newOrder 새로운 순서 인덱스
   */
  public void updateOrder(int newOrder) {
    this.orderIndex = newOrder;
  }
}