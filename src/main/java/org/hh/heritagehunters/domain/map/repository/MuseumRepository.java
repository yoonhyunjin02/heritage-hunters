package org.hh.heritagehunters.domain.map.repository;

import org.hh.heritagehunters.domain.map.entity.Museum;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MuseumRepository extends JpaRepository<Museum, Long> {
}