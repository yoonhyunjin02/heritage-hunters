package org.hh.heritagehunters.domain.search.repository;

import java.util.List;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HeritageRepository extends JpaRepository<Heritage, Long> {

  @Query("""
        select h from Heritage h
        where h.latitude is not null and h.longitude is not null
          and (:designations is null or h.designation in :designations)
          and (:regions is null or h.region in :regions)
          and (:eras is null or h.era in :eras)
        """)
  List<Heritage> findForMap(
      @Param("designations") List<String> designations,
      @Param("regions") List<String> regions,
      @Param("eras") List<String> eras
  );
}
