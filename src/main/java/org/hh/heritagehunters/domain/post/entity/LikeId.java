package org.hh.heritagehunters.domain.post.entity;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LikeId implements Serializable {
  private Long userId;
  private Long postId;
}
