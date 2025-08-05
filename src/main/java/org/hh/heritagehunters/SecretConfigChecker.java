package org.hh.heritagehunters;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class SecretConfigChecker implements CommandLineRunner {

  @Value("${DB_URL:NOT_LOADED}")
  private String dbUrl;

  @Value("${DB_USERNAME:NOT_LOADED}")
  private String dbUsername;

  @Value("${DB_PASSWORD:NOT_LOADED}")
  private String dbPassword;

  @Autowired
  private Environment env;

  @Override
  public void run(String... args) {
    System.out.println("=== Property Sources ===");
    for (org.springframework.core.env.PropertySource<?> ps : ((org.springframework.core.env.AbstractEnvironment) env).getPropertySources()) {
      System.out.println(ps.getName());
    }

    System.out.println("== DB Config Check ==");
    System.out.println("DB_URL: " + env.getProperty("spring.datasource.url", "NOT_LOADED"));
    System.out.println("DB_USERNAME: " + env.getProperty("spring.datasource.username", "NOT_LOADED"));
    System.out.println("DB_PASSWORD: " + env.getProperty("spring.datasource.password", "NOT_LOADED"));
  }


}
