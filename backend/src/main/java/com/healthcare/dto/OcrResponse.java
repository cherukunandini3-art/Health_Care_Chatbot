package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for OCR operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OcrResponse {

    private boolean success;
    private String extractedText;
    private String message;
    private String fileType;
    private int characterCount;

    /**
     * Populated only when structured lab extraction is requested
     */
    private Map<String, String> labValues;
}
