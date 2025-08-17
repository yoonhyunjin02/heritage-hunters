package org.hh.heritagehunters.domain.search.repository;

import java.util.List;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.Query;

public interface HeritageRepository extends JpaRepository<Heritage, Long>, JpaSpecificationExecutor<Heritage> {

}
