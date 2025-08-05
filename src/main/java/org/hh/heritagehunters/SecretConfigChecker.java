package org.hh.heritagehunters;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SecretConfigChecker implements CommandLineRunner {

  @Value("${DB_URL:NOT_LOADED}")
  private String dbUrl;

  @Value("${DB_USERNAME:NOT_LOADED}")
  private String dbUsername;

  @Value("${DB_PASSWORD:NOT_LOADED}")
  private String dbPassword;

  @Value("${spring.application.name:NOT_LOADED}")
  private String appName;

  @Override
  public void run(String... args) {
    System.out.println("== DB Config Check ==");
    System.out.println("DB_URL: " + dbUrl);
    System.out.println("DB_USERNAME: " + dbUsername);
    System.out.println("DB_PASSWORD: " + dbPassword);

    System.out.println("APP_NAME: " + appName);
  }


}
