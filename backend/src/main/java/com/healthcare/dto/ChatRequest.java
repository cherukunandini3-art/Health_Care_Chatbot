package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for chat messages
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    
    private Long sessionId;
    
    @NotBlank(message = "Message is required")
    private String message;
}
