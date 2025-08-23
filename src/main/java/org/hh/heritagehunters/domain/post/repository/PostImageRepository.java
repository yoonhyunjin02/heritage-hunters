package org.hh.heritagehunters.domain.post.repository;

import java.util.List;
import org.hh.heritagehunters.domain.post.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {

  @Query("""
    select i
    from PostImage i
    where i.post.id in :postIds
      and i.orderIndex = 0
  """)
  List<PostImage> findThumbnailsByPostIds(@Param("postIds") List<Long> postIds);
}

