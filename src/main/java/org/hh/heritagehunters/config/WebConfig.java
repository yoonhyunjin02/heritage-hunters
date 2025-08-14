package org.hh.heritagehunters.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  // 이미지 파일이 저장되는 절대경로(Root/uploads)
  private static final Path UPLOAD_ROOT =
      Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath();

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
    
    // 업로드 이미지 리소스(local)
    registry
        .addResourceHandler("/uploads/**")
        .addResourceLocations("file:" + UPLOAD_ROOT.toString() + "/");
  }
}