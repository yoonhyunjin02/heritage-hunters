package org.hh.heritagehunters.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // 공통 정적 리소스
    registry
        .addResourceHandler("/common/css/**")
        .addResourceLocations("classpath:/static/common/css/");

    registry
        .addResourceHandler("/common/js/**")
        .addResourceLocations("classpath:/static/common/js/");

    // 기능별 정적 리소스
    registry
        .addResourceHandler("/features/**")
        .addResourceLocations("classpath:/static/features/");

    // 이미지 리소스
    registry
        .addResourceHandler("/images/**")
        .addResourceLocations("classpath:/static/images/");
  }
}