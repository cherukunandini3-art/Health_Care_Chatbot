package com.healthcare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main application class for Healthcare Chat Assistant
 */
@SpringBootApplication
@EnableAsync
public class HealthcareChatAssistantApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(HealthcareChatAssistantApplication.class, args);
    }
}
