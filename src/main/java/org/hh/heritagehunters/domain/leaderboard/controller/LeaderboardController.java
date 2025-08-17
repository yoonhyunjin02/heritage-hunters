package org.hh.heritagehunters.domain.leaderboard.controller;

import lombok.RequiredArgsConstructor;
import org.hh.heritagehunters.domain.leaderboard.dto.LeaderboardUserDto;
import org.hh.heritagehunters.domain.leaderboard.service.LeaderboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class LeaderboardController {

  private final LeaderboardService leaderboardService;

  @GetMapping("/leaderboards")
  public String leaderboard(@AuthenticationPrincipal UserDetails userDetails,
      Model model) {
    // 상위 24명
    List<LeaderboardUserDto> topUsers = leaderboardService.getTopUsers();
    model.addAttribute("users", topUsers);

    // 현재 로그인한 유저
    LeaderboardUserDto currentUser = null;
    if (userDetails != null) {
      String email = userDetails.getUsername(); // Security에서 username = email
      currentUser = leaderboardService.getCurrentUser(email);
    }
    model.addAttribute("currentUser", currentUser);

    return "features/leaderboard/leaderboard";
  }
}