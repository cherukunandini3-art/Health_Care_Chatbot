package com.healthcare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.dto.LocationChatResponse;
import com.healthcare.dto.LocationChatResponse.DoctorDTO;
import com.healthcare.dto.LocationChatResponse.HospitalDTO;
import com.healthcare.model.Doctor;
import com.healthcare.model.Role;
import com.healthcare.model.User;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.RoleRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.util.HaversineUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for location-aware medical chat: - Detects required specialization
 * from message keywords - Queries DB for nearby available doctors (Haversine, ≤
 * 120 km) - Fetches nearby hospitals from OpenStreetMap Overpass API (1-30 km)
 * - Gets AI suggestion from Ollama (or OpenAI fallback)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LocationChatService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OpenAIService openAIService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final double DOCTOR_RADIUS_KM = 120.0;
    private static final double HOSPITAL_MIN_RADIUS_KM = 1.0;
    private static final double HOSPITAL_MAX_RADIUS_KM = 30.0;
    private static final int MAX_DOCTORS = 20;
    private static final int MAX_HOSPITALS = 20;
    private static final Map<String, List<HospitalDTO>> HOSPITAL_CACHE = new ConcurrentHashMap<>();

    // Keyword → specialization mapping
    private static final Map<String, String> KEYWORD_SPECIALIZATION = new LinkedHashMap<>();

    static {
        KEYWORD_SPECIALIZATION.put("chest pain", "Cardiologist");
        KEYWORD_SPECIALIZATION.put("heart", "Cardiologist");
        KEYWORD_SPECIALIZATION.put("palpitation", "Cardiologist");
        KEYWORD_SPECIALIZATION.put("skin rash", "Dermatologist");
        KEYWORD_SPECIALIZATION.put("rash", "Dermatologist");
        KEYWORD_SPECIALIZATION.put("acne", "Dermatologist");
        KEYWORD_SPECIALIZATION.put("eye pain", "Ophthalmologist");
        KEYWORD_SPECIALIZATION.put("blurry vision", "Ophthalmologist");
        KEYWORD_SPECIALIZATION.put("red eye", "Ophthalmologist");
        KEYWORD_SPECIALIZATION.put("tooth", "Dentist");
        KEYWORD_SPECIALIZATION.put("dental", "Dentist");
        KEYWORD_SPECIALIZATION.put("bone", "Orthopedist");
        KEYWORD_SPECIALIZATION.put("joint pain", "Orthopedist");
        KEYWORD_SPECIALIZATION.put("fracture", "Orthopedist");
        KEYWORD_SPECIALIZATION.put("child", "Pediatrician");
        KEYWORD_SPECIALIZATION.put("baby", "Pediatrician");
        KEYWORD_SPECIALIZATION.put("mental", "Psychiatrist");
        KEYWORD_SPECIALIZATION.put("anxiety", "Psychiatrist");
        KEYWORD_SPECIALIZATION.put("depression", "Psychiatrist");
        KEYWORD_SPECIALIZATION.put("stomach", "Gastroenterologist");
        KEYWORD_SPECIALIZATION.put("diarrhea", "Gastroenterologist");
        KEYWORD_SPECIALIZATION.put("vomit", "Gastroenterologist");
        // Default
        KEYWORD_SPECIALIZATION.put("fever", "General Physician");
        KEYWORD_SPECIALIZATION.put("body pain", "General Physician");
        KEYWORD_SPECIALIZATION.put("headache", "General Physician");
        KEYWORD_SPECIALIZATION.put("cold", "General Physician");
        KEYWORD_SPECIALIZATION.put("cough", "General Physician");
        KEYWORD_SPECIALIZATION.put("fatigue", "General Physician");
    }

    /**
     * Main entry: process location-aware chat request — parallel execution
     */
    public LocationChatResponse process(String message, Double lat, Double lon) {
        // 1. Detect specialization
        String specialization = detectSpecialization(message);
        log.info("Detected specialization: {} for message: {}", specialization, message);

        // 2. Run AI + DB + Overpass in parallel
        CompletableFuture<String[]> aiFuture = CompletableFuture.supplyAsync(() -> getAiSuggestion(message, specialization));

        CompletableFuture<List<DoctorDTO>> doctorFuture = CompletableFuture.supplyAsync(()
                -> (lat != null && lon != null) ? findNearbyDoctors(lat, lon, specialization) : Collections.emptyList());

        CompletableFuture<List<HospitalDTO>> hospitalFuture = CompletableFuture.supplyAsync(()
                -> (lat != null && lon != null) ? fetchNearbyHospitals(lat, lon) : Collections.emptyList());

        // Wait for all
        CompletableFuture.allOf(aiFuture, doctorFuture, hospitalFuture).join();

        String[] aiSuggestion = aiFuture.join();
        return LocationChatResponse.builder()
                .aiSuggestionEnglish(aiSuggestion[0])
                .aiSuggestionTelugu(aiSuggestion[1])
                .recommendedDoctors(doctorFuture.join())
                .nearbyHospitals(hospitalFuture.join())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // Specialization detection
    // ──────────────────────────────────────────────────────────────
    public String detectSpecialization(String message) {
        String lower = message.toLowerCase();
        for (Map.Entry<String, String> entry : KEYWORD_SPECIALIZATION.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "General Physician";
    }

    // ──────────────────────────────────────────────────────────────
    // AI suggestion via OpenAIService (Ollama / OpenAI) — returns [english, telugu]
    // ──────────────────────────────────────────────────────────────
    private String[] getAiSuggestion(String message, String specialization) {
        String fallbackEn = "Based on your symptoms, I recommend consulting a " + specialization
                + ". Please seek professional medical advice for an accurate diagnosis.";
        String fallbackTe = "మీ లక్షణాల ఆధారంగా, " + specialization + "ని సంప్రదించమని సిఫారసు చేస్తున్నాను. సరైన నిర్ధారణ కోసం వైద్య సహాయం తీసుకోండి.";
        try {
            String systemPrompt
                    = "You are a medical assistant. User symptoms: \"" + message + "\"\n"
                    + "Recommended specialist: " + specialization + "\n\n"
                    + "Reply ONLY as JSON (no code fences, no extra text):\n"
                    + "{\"aiSuggestionEnglish\":\"brief English advice max 60 words\","
                    + "\"aiSuggestionTelugu\":\"same advice in Telugu\"}";

            List<Map<String, String>> msgs = new ArrayList<>();
            msgs.add(Map.of("role", "user", "content", systemPrompt));
            String raw = openAIService.callOllama(msgs);

            // Extract JSON from response (model may wrap it in markdown code block)
            String jsonStr = extractJson(raw);
            JsonNode node = objectMapper.readTree(jsonStr);
            String en = node.has("aiSuggestionEnglish") ? node.get("aiSuggestionEnglish").asText() : fallbackEn;
            String te = node.has("aiSuggestionTelugu") ? node.get("aiSuggestionTelugu").asText() : fallbackTe;
            return new String[]{en, te};
        } catch (Exception e) {
            log.warn("AI bilingual suggestion parse failed, using fallback. Reason: {}", e.getMessage());
            return new String[]{fallbackEn, fallbackTe};
        }
    }

    /**
     * Strip markdown code fences and find the first {...} JSON block
     */
    private String extractJson(String raw) {
        if (raw == null) {
            return "{}";
        }
        // Remove ```json ... ``` fences
        String cleaned = raw.replaceAll("```[a-zA-Z]*\\n?", "").replace("```", "").trim();
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    // ──────────────────────────────────────────────────────────────
    // Nearby doctors from DB
    // ──────────────────────────────────────────────────────────────
    private List<DoctorDTO> findNearbyDoctors(double lat, double lon, String specialization) {
        // Multi-level fallback so users still see doctors when specialization/radius is sparse.
        List<Map.Entry<Doctor, Double>> prioritized = doctorRepository.findBySpecializationAndAvailableTrue(specialization).stream()
                .map(d -> {
                    double dist = HaversineUtil.distanceKm(lat, lon, d.getLatitude(), d.getLongitude());
                    return new AbstractMap.SimpleEntry<>(d, dist);
                })
                .filter(e -> e.getValue() <= DOCTOR_RADIUS_KM)
                .sorted(Comparator.comparingDouble(Map.Entry::getValue))
                .collect(Collectors.toList());

        if (prioritized.size() < MAX_DOCTORS) {
            Set<Long> selectedDoctorIds = prioritized.stream()
                    .map(e -> e.getKey().getId())
                    .collect(Collectors.toSet());

            List<Map.Entry<Doctor, Double>> nearestFallback = doctorRepository.findByAvailableTrue().stream()
                    .filter(d -> !selectedDoctorIds.contains(d.getId()))
                    .map(d -> {
                        double dist = HaversineUtil.distanceKm(lat, lon, d.getLatitude(), d.getLongitude());
                        return new AbstractMap.SimpleEntry<>(d, dist);
                    })
                    .filter(e -> e.getValue() <= DOCTOR_RADIUS_KM)
                    .sorted(Comparator.comparingDouble(Map.Entry::getValue))
                    .limit(MAX_DOCTORS - prioritized.size())
                    .collect(Collectors.toList());

            prioritized.addAll(nearestFallback);

            if (prioritized.size() < MAX_DOCTORS) {
                List<Map.Entry<Doctor, Double>> anyDistanceAvailable = doctorRepository.findByAvailableTrue().stream()
                        .filter(d -> !selectedDoctorIds.contains(d.getId()))
                        .map(d -> {
                            double dist = HaversineUtil.distanceKm(lat, lon, d.getLatitude(), d.getLongitude());
                            return new AbstractMap.SimpleEntry<>(d, dist);
                        })
                        .sorted(Comparator.comparingDouble(Map.Entry::getValue))
                        .limit(MAX_DOCTORS - prioritized.size())
                        .collect(Collectors.toList());

                prioritized.addAll(anyDistanceAvailable);
                selectedDoctorIds.addAll(anyDistanceAvailable.stream()
                        .map(e -> e.getKey().getId())
                        .collect(Collectors.toSet()));
            }

            if (prioritized.size() < MAX_DOCTORS) {
                List<Map.Entry<Doctor, Double>> anyDoctorFallback = doctorRepository.findAll().stream()
                        .filter(d -> !selectedDoctorIds.contains(d.getId()))
                        .map(d -> {
                            double dist = HaversineUtil.distanceKm(lat, lon, d.getLatitude(), d.getLongitude());
                            return new AbstractMap.SimpleEntry<>(d, dist);
                        })
                        .sorted(Comparator.comparingDouble(Map.Entry::getValue))
                        .limit(MAX_DOCTORS - prioritized.size())
                        .collect(Collectors.toList());

                prioritized.addAll(anyDoctorFallback);
            }
        }

        List<DoctorDTO> geolocatedResults = prioritized.stream()
                .sorted(Comparator.comparingDouble(Map.Entry::getValue))
                .limit(MAX_DOCTORS)
                .map(e -> DoctorDTO.builder()
                .id(e.getKey().getId())
                .name(e.getKey().getName())
                .specialization(e.getKey().getSpecialization())
                .distance(HaversineUtil.format(e.getValue()))
                .build())
                .collect(Collectors.toList());

        if (!geolocatedResults.isEmpty()) {
            return geolocatedResults;
        }

        return findRoleDoctorFallback(specialization);
    }

    private List<DoctorDTO> findRoleDoctorFallback(String specialization) {
        return roleRepository.findByName(Role.RoleName.ROLE_DOCTOR)
                .map(userRepository::findByRolesContaining)
                .orElse(Collections.emptyList())
                .stream()
                .limit(MAX_DOCTORS)
                .map(this::toDoctorDisplayName)
                .map(name -> DoctorDTO.builder()
                .id(null)
                .name(name)
                .specialization(specialization)
                .distance("Distance unavailable")
                .build())
                .collect(Collectors.toList());
    }

    private String toDoctorDisplayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername();
    }

    // ──────────────────────────────────────────────────────────────
    // Nearby hospitals from OpenStreetMap Overpass API
    // ──────────────────────────────────────────────────────────────
    private List<HospitalDTO> fetchNearbyHospitals(double lat, double lon) {
        String cacheKey = locationCacheKey(lat, lon);
        try {
            int radiusMeters = (int) (HOSPITAL_MAX_RADIUS_KM * 1000);
            String query = String.format(
                    "[out:json][timeout:10];(node[\"amenity\"=\"hospital\"](around:%d,%f,%f);"
                    + "way[\"amenity\"=\"hospital\"](around:%d,%f,%f););out center;",
                    radiusMeters, lat, lon, radiusMeters, lat, lon
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<String> request = new HttpEntity<>("data=" + query, headers);

            List<String> endpoints = List.of(
                    "https://overpass-api.de/api/interpreter",
                    "https://overpass.kumi.systems/api/interpreter"
            );

            for (String endpoint : endpoints) {
                try {
                    ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        List<HospitalDTO> hospitals = parseHospitals(response.getBody(), lat, lon);
                        if (!hospitals.isEmpty()) {
                            HOSPITAL_CACHE.put(cacheKey, hospitals);
                            return hospitals;
                        }
                    }
                } catch (Exception endpointError) {
                    log.warn("Overpass endpoint failed ({}): {}", endpoint, endpointError.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Overpass API call failed: {}", e.getMessage());
        }

        // Fallback for repeated requests from the same area when Overpass is rate-limited.
        return HOSPITAL_CACHE.getOrDefault(cacheKey, Collections.emptyList());
    }

    private List<HospitalDTO> parseHospitals(String json, double userLat, double userLon) {
        List<HospitalDistanceDTO> withDistance = new ArrayList<>();
        Set<String> unique = new HashSet<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode elements = root.get("elements");
            if (elements == null || !elements.isArray()) {
                return Collections.emptyList();
            }

            for (JsonNode el : elements) {
                String name = null;
                JsonNode tags = el.get("tags");
                if (tags != null && tags.has("name")) {
                    name = tags.get("name").asText();
                }
                if (name == null || name.isBlank()) {
                    name = "Unnamed Hospital";
                }

                double hLat, hLon;
                if (el.has("center")) {
                    hLat = el.get("center").get("lat").asDouble();
                    hLon = el.get("center").get("lon").asDouble();
                } else {
                    hLat = el.has("lat") ? el.get("lat").asDouble() : userLat;
                    hLon = el.has("lon") ? el.get("lon").asDouble() : userLon;
                }

                double distanceKm = HaversineUtil.distanceKm(userLat, userLon, hLat, hLon);
                if (distanceKm > HOSPITAL_MAX_RADIUS_KM) {
                    continue;
                }

                String dedupeKey = (name.trim().toLowerCase(Locale.ROOT) + "|"
                        + String.format(Locale.ROOT, "%.4f", hLat) + "|"
                        + String.format(Locale.ROOT, "%.4f", hLon));
                if (!unique.add(dedupeKey)) {
                    continue;
                }

                withDistance.add(new HospitalDistanceDTO(
                        HospitalDTO.builder()
                                .name(name)
                                .latitude(hLat)
                                .longitude(hLon)
                                .distance(HaversineUtil.format(distanceKm))
                                .build(),
                        distanceKm
                ));
            }
        } catch (Exception e) {
            log.warn("Hospital JSON parse error: {}", e.getMessage());
        }

        List<HospitalDTO> withinOneToThirty = withDistance.stream()
                .filter(h -> h.distanceKm >= HOSPITAL_MIN_RADIUS_KM)
                .sorted(Comparator.comparingDouble(h -> h.distanceKm))
                .limit(MAX_HOSPITALS)
                .map(h -> h.hospital)
                .collect(Collectors.toList());

        // If there are no hospitals beyond 1 km, still return nearest hospitals inside 30 km.
        if (!withinOneToThirty.isEmpty()) {
            return withinOneToThirty;
        }

        return withDistance.stream()
                .sorted(Comparator.comparingDouble(h -> h.distanceKm))
                .limit(MAX_HOSPITALS)
                .map(h -> h.hospital)
                .collect(Collectors.toList());
    }

    private String locationCacheKey(double lat, double lon) {
        return String.format(Locale.ROOT, "%.2f:%.2f", lat, lon);
    }

    private static final class HospitalDistanceDTO {

        private final HospitalDTO hospital;
        private final double distanceKm;

        private HospitalDistanceDTO(HospitalDTO hospital, double distanceKm) {
            this.hospital = hospital;
            this.distanceKm = distanceKm;
        }
    }
}
