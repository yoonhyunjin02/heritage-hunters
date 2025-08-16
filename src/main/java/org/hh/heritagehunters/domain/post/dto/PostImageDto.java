package org.hh.heritagehunters.domain.post.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hh.heritagehunters.domain.post.entity.PostImage;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostImageDto {

  private Long id;
  private String url;
  private Integer orderIndex;
  private boolean isMainImage;

  public static PostImageDto from(PostImage postImage) {
    return new PostImageDto(
        postImage.getId(),
        postImage.getUrl(),
        postImage.getOrderIndex(),
        postImage.isMainImage()
    );
  }


}
