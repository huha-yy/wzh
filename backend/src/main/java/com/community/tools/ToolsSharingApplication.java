package com.community.tools;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.PropertyValue;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import javax.sql.DataSource;

@SpringBootApplication
public class ToolsSharingApplication {
    public static void main(String[] args) {
        SpringApplication.run(ToolsSharingApplication.class, args);
    }

    @Bean
    ApplicationRunner databaseInitializer(DataSource dataSource) {
        return args -> {
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("schema.sql"));
            populator.setContinueOnError(true);
            populator.execute(dataSource);
        };
    }

    
}
