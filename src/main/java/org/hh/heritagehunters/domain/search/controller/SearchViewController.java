package org.hh.heritagehunters.domain.search.controller;


import java.util.List;
import java.util.Optional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/search")
public class SearchViewController {

  @GetMapping
  public String searchForm(
      @RequestParam Optional<String> keyword,
      Model model
  ) {
    model.addAttribute("designationOptions", List.of(
        "전체", "국보", "보물", "사적", "명승", "천연기념물",
        "국가무형유산", "국가민속문화유산", "국가등록문화유산",
        "시도유형문화유산", "시도무형유산", "시도자연유산",
        "시도기념물", "시도민속문화유산", "시도등록문화유산",
        "시도문화유산자료", "시도자연유산자료", "이북5도 무형유산"
    ));
    model.addAttribute("regionOptions", List.of(
        "전체", "서울", "부산", "대구", "인천", "광주", "대전", "울산",
        "세종", "경기", "강원", "충북", "충남", "전북", "전남",
        "경북", "경남", "제주", "전국일원"
    ));
    model.addAttribute("eraOptions", List.of(
        "전체", "선사시대", "석기시대", "청동기시대", "철기시대",
        "삼한시대", "삼국시대", "삼국:고구려", "삼국:백제", "삼국:신라",
        "발해", "통일신라", "고려시대", "조선시대", "대한제국시대",
        "일제강점기", "시대미상"
    ));
    model.addAttribute("typeOptions", List.of(
        "전체", "유적건조물", "기록유산", "유물", "무형유산", "자연유산", "등록문화유산"
    ));
    // 검색 결과, 페이징 정보 등도 model에 추가…
    return "/features/search/search_page";
  }


}
