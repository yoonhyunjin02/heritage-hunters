package org.hh.heritagehunters.domain.search.controller;


import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.search.dto.HeritageResponse;
import org.hh.heritagehunters.domain.search.dto.HeritageSearchRequest;
import org.hh.heritagehunters.domain.search.service.HeritageService;
import org.hh.heritagehunters.domain.search.util.DesignationCodeMapper;
import org.hh.heritagehunters.domain.search.util.RegionCodeMapper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchViewController {

  private final HeritageService heritageService;

  @GetMapping
  public String searchForm(
      @ModelAttribute HeritageSearchRequest request,
      @RequestParam(required = false) Boolean searchTriggered,
      Model model
  ) {
    model.addAttribute("eraOptions", List.of(
        "전체", "선사시대", "석기시대", "청동기시대", "철기시대",
        "삼한시대", "삼국시대", "삼국:고구려", "삼국:백제", "삼국:신라",
        "발해", "통일신라", "고려시대", "조선시대", "대한제국시대",
        "일제강점기", "시대미상"
    ));

    model.addAttribute("designationMap", DesignationCodeMapper.getCodeMap());
    model.addAttribute("designationCodes",
        Arrays.stream(DesignationCodeMapper.getCodeMap().keySet().toArray()).sorted());
    model.addAttribute("regionMap", RegionCodeMapper.getCodeMap());
    model.addAttribute("regionCodes", Arrays.stream(RegionCodeMapper.getCodeMap().keySet().toArray()).sorted());

    boolean hasAnyCriteria =
        Boolean.TRUE.equals(searchTriggered)     // 검색 버튼 눌렀으면 무조건 조회
            || request.hasSearchCondition();            // 기존 필터/키워드가 있으면 조회

    Page<HeritageResponse> page;
    if (hasAnyCriteria) {
      page = heritageService.search(request);
      model.addAttribute("results", page.getContent());
      model.addAttribute("hasPrev", page.hasPrevious());
      model.addAttribute("hasNext", page.hasNext());

      // 페이지 번호 10개씩 그룹핑
      int current = request.page();
      int totalPages = page.getTotalPages();
      int groupSize = 10;
      int start = ((current - 1) / groupSize) * groupSize + 1;
      int end = Math.min(start + groupSize - 1, totalPages);

      List<Integer> pageNumbers = IntStream.rangeClosed(start, end)
          .boxed()
          .collect(Collectors.toList());

      model.addAttribute("pageNumbers", pageNumbers);
      model.addAttribute("currentPage", current);
      model.addAttribute("totalPages", totalPages);

    } else {
      // 최초 진입: 빈 화면
      model.addAttribute("results", List.<HeritageResponse>of());
      model.addAttribute("hasPrev", false);
      model.addAttribute("hasNext", false);
      model.addAttribute("pageNumbers", List.<Integer>of());
      model.addAttribute("currentPage", 1);
      model.addAttribute("totalPages", 0);
    }

    // 현재 선택된 필터/키워드 유지
    model.addAttribute("selectedDesignations", request.designation());
    model.addAttribute("selectedRegions", request.region());
    model.addAttribute("selectedEras", request.era());
    model.addAttribute("keyword", request.keyword());

    return "features/search/search_page";
  }

}
