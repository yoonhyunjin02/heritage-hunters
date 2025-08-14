package org.hh.heritagehunters.domain.search.repository;

import java.util.List;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.Query;

public interface HeritageRepository extends JpaRepository<Heritage, Long>, JpaSpecificationExecutor<Heritage> {

  interface StampProjection {

    Long getId();

    String getName();

    String getThumbnailUrl(); // Heritage.thumbnailUrl 필드 기반
  }

  @Query("select h.id as id, h.name as name, h.thumbnailUrl as thumbnailUrl from Heritage h")
  List<StampProjection> findAllForStamp();
}
