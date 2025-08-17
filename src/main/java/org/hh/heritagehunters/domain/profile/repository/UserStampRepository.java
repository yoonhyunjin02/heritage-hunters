package org.hh.heritagehunters.domain.profile.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.hh.heritagehunters.domain.profile.entity.UserStamp;
import org.hh.heritagehunters.domain.profile.entity.UserStampId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserStampRepository extends JpaRepository<UserStamp, UserStampId> {

  @Query("""
        select h.id as id,
               h.name as name,
               h.thumbnailUrl as thumbnailUrl,
               us.earned_at as earnedAt
        from UserStamp us
        join Heritage h on us.heritage_id = h.id
        where us.user_id = :userId
        order by us.earned_at desc
    """)
  List<ObtainedStampProjection> findObtainedStamps(@Param("userId") Long userId);

  interface ObtainedStampProjection {
    Long getId();
    String getName();
    String getThumbnailUrl();
    LocalDateTime getEarnedAt();
  }
}

