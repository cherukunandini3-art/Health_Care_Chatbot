package com.healthcare.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationChatRequest {

    private String message;
    private Double latitude;
    private Double longitude;
}
