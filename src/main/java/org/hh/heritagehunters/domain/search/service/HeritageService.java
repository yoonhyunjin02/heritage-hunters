package org.hh.heritagehunters.domain.search.service;

import org.hh.heritagehunters.common.exception.NotFoundException;
import org.hh.heritagehunters.common.exception.payload.ErrorCode;
import org.hh.heritagehunters.domain.search.dto.HeritageResponse;
import org.hh.heritagehunters.domain.search.dto.HeritageSearchRequest;
import org.hh.heritagehunters.domain.search.entity.Heritage;
import org.hh.heritagehunters.domain.search.repository.HeritageRepository;
import org.hh.heritagehunters.domain.search.specification.HeritageSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public class HeritageService {

  private final HeritageRepository repo;

  public HeritageService(HeritageRepository repo) {
    this.repo = repo;
  }

  public Page<HeritageResponse> search(HeritageSearchRequest req) {
    Specification<Heritage> spec = HeritageSpecification.withCriteria(req.toCriteria());
    Pageable page = req.toPageable();
    return repo.findAll(spec, page)
        .map(HeritageResponse::fromEntity);
  }

  public HeritageResponse getDetail(Long id) {
    Heritage h = repo.findById(id)
        .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
    return HeritageResponse.fromEntity(h);
  }
}
