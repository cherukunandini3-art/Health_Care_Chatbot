package com.healthcare.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationChatResponse {

    private String aiSuggestionEnglish;
    private String aiSuggestionTelugu;
    private List<DoctorDTO> recommendedDoctors;
    private List<HospitalDTO> nearbyHospitals;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorDTO {

        private Long id;
        private String name;
        private String specialization;
        private String distance; // e.g. "2.4 km"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HospitalDTO {

        private String name;
        private Double latitude;
        private Double longitude;
        private String distance; // e.g. "3.2 km"
    }
}
