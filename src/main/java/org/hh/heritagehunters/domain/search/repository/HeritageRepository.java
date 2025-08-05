package org.hh.heritagehunters.domain.search.repository;

import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface HeritageRepository
    extends JpaRepository<Heritage, Long>,
    JpaSpecificationExecutor<Heritage> {

}

