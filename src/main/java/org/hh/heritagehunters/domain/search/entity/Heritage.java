package org.hh.heritagehunters.domain.search.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "heritages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Heritage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id; // 자동생성

  private String name;

  private String name_en;

  private String thumbnail_url; // 메인노출이미지 URL

  private String description;

  private Integer designation;

  private Integer region;

  private String address; // 주소

  private String era;

  private BigDecimal latitude;

  private BigDecimal longitude;
}
