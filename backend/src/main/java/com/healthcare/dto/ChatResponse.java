package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for chat response with structured medical information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    private Long messageId;
    private Long sessionId;
    private String response;
    private String responseTelugu;
    private StructuredResponse structuredResponse;
    private Boolean isEmergency;
    private LocalDateTime timestamp;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StructuredResponse {

        private String symptomSummary;
        private String possibleCauses;
        private String severityLevel;
        private String recommendedAction;
        private String disclaimer;
    }
}
