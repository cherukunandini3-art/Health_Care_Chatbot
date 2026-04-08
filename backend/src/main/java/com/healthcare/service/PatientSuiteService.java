package com.healthcare.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.model.PatientSuiteState;
import com.healthcare.model.Role;
import com.healthcare.model.User;
import com.healthcare.repository.PatientSuiteStateRepository;
import com.healthcare.repository.RoleRepository;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientSuiteService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private static final Map<String, Integer> TREATMENT_BASE_COST = Map.of(
            "General Checkup", 800,
            "Cardiology Consultation", 2400,
            "Orthopedic Evaluation", 2000,
            "Diabetes Management", 1800,
            "Mental Wellness Session", 1500
    );

    private static final Map<String, Double> INSURANCE_COVERAGE = Map.of(
            "Basic", 0.45,
            "Standard", 0.65,
            "Premium", 0.82,
            "None", 0.0
    );

    private final PatientSuiteStateRepository suiteStateRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getState(User user) {
        PatientSuiteState state = suiteStateRepository.findByUser(user)
                .orElseGet(() -> suiteStateRepository.save(newState(user)));
        return parseState(state.getStateJson());
    }

    public Map<String, Object> saveState(User user, Map<String, Object> requestedState) {
        Map<String, Object> sanitized = mergeWithDefaults(requestedState);
        sanitized.put("lastUpdatedAt", LocalDateTime.now().toString());

        PatientSuiteState state = suiteStateRepository.findByUser(user).orElseGet(() -> newState(user));
        state.setStateJson(writeState(sanitized));
        suiteStateRepository.save(state);
        return sanitized;
    }

    public Map<String, Object> estimateCost(User user, Map<String, Object> payload) {
        String treatment = String.valueOf(payload.getOrDefault("treatment", "General Checkup"));
        double severity = toDouble(payload.get("severity"), 1.0);
        int days = (int) toDouble(payload.get("days"), 1);
        String insurancePlan = String.valueOf(payload.getOrDefault("insurancePlan", "Standard"));

        int baseCost = TREATMENT_BASE_COST.getOrDefault(treatment, 1000);
        int estimatedCost = (int) Math.round(baseCost * severity + days * 220);

        double coverage = INSURANCE_COVERAGE.getOrDefault(insurancePlan, 0.0);
        int coveredAmount = (int) Math.round(estimatedCost * coverage);
        int outOfPocket = Math.max(0, estimatedCost - coveredAmount);
        int claimChance = Math.min(97, (int) Math.round(58 + coverage * 35 - severity * 4));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("treatment", treatment);
        result.put("severity", round(severity, 1));
        result.put("days", days);
        result.put("insurancePlan", insurancePlan);
        result.put("estimatedCost", estimatedCost);
        result.put("coveredAmount", coveredAmount);
        result.put("outOfPocket", outOfPocket);
        result.put("claimApprovalChance", claimChance);
        result.put("createdAt", LocalDateTime.now().toString());

        Map<String, Object> state = getState(user);
        List<Map<String, Object>> history = getList(state, "costEstimations");
        history.add(0, result);
        if (history.size() > 30) {
            history = history.subList(0, 30);
        }
        state.put("costEstimations", history);

        List<Map<String, Object>> insuranceVariance = getList(state, "insuranceVarianceLogs");
        Map<String, Object> varPoint = new LinkedHashMap<>();
        varPoint.put("date", LocalDate.now().toString());
        varPoint.put("estimatedCost", estimatedCost);
        varPoint.put("coveredAmount", coveredAmount);
        varPoint.put("outOfPocket", outOfPocket);
        insuranceVariance.add(varPoint);
        if (insuranceVariance.size() > 30) {
            insuranceVariance = insuranceVariance.subList(insuranceVariance.size() - 30, insuranceVariance.size());
        }
        state.put("insuranceVarianceLogs", insuranceVariance);
        appendSuiteEvent(state, "COST_ESTIMATE", treatment + " estimation generated");

        saveState(user, state);
        return result;
    }

    public List<Map<String, Object>> getRecentEvents(User user) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> events = getList(state, "suiteEvents");
        Collections.reverse(events);
        return events.stream().limit(20).collect(Collectors.toList());
    }

    public Map<String, Object> getCharts(User user) {
        Map<String, Object> state = getState(user);

        List<Map<String, Object>> adherenceLogs = getList(state, "adherenceLogs");
        List<Map<String, Object>> waitTimeLogs = getList(state, "waitTimeLogs");
        List<Map<String, Object>> insuranceVarianceLogs = getList(state, "insuranceVarianceLogs");

        Map<String, Object> charts = new LinkedHashMap<>();
        charts.put("adherenceWeekly", takeLast(adherenceLogs, 7));
        charts.put("waitTimeTrend", takeLast(waitTimeLogs, 7));
        charts.put("insuranceVariance", takeLast(insuranceVarianceLogs, 8));
        return charts;
    }

    public List<Map<String, Object>> getOptimizedSlots(User user) {
        List<Map<String, Object>> doctors = getDoctorProfiles();
        if (doctors.isEmpty()) {
            doctors = List.of(Map.of("name", "Care Team", "specialization", "General Physician"));
        }

        String[] slots = {"09:30 AM", "11:10 AM", "01:30 PM", "04:00 PM"};
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < slots.length; i++) {
            Map<String, Object> doctor = doctors.get(i % doctors.size());
            int queue = 2 + (i * 2);
            int waitMin = 12 + (i * 8);
            int score = Math.max(65, 95 - i * 7);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("doctor", doctor.get("name"));
            item.put("specialization", doctor.get("specialization"));
            item.put("slot", slots[i]);
            item.put("queue", queue);
            item.put("waitMin", waitMin);
            item.put("score", score);
            result.add(item);
        }

        Map<String, Object> state = getState(user);
        List<Map<String, Object>> waitTimeLogs = getList(state, "waitTimeLogs");
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("date", LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        point.put("avgWait", result.stream().mapToInt(i -> (int) i.get("waitMin")).average().orElse(20));
        waitTimeLogs.add(point);
        if (waitTimeLogs.size() > 30) {
            waitTimeLogs = waitTimeLogs.subList(waitTimeLogs.size() - 30, waitTimeLogs.size());
        }
        state.put("waitTimeLogs", waitTimeLogs);
        saveState(user, state);

        return result;
    }

    public List<Map<String, Object>> getHospitalInsights() {
        List<Map<String, Object>> hospitals = new ArrayList<>();
        hospitals.add(hospital("City Heart Care", "4.8 km", 74, 92, 88));
        hospitals.add(hospital("Green Valley Multispeciality", "8.2 km", 61, 84, 91));
        hospitals.add(hospital("Sunrise Medical Center", "12.1 km", 55, 78, 80));
        hospitals.add(hospital("Riverfront Community Hospital", "17.6 km", 46, 69, 71));
        return hospitals;
    }

    public Map<String, Object> appendAdherenceLog(User user, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> adherenceLogs = getList(state, "adherenceLogs");

        Map<String, Object> point = new LinkedHashMap<>();
        point.put("date", String.valueOf(payload.getOrDefault("date", LocalDate.now().toString())));
        point.put("adherence", (int) toDouble(payload.get("adherence"), 0));
        adherenceLogs.add(point);

        if (adherenceLogs.size() > 30) {
            adherenceLogs = adherenceLogs.subList(adherenceLogs.size() - 30, adherenceLogs.size());
        }

        state.put("adherenceLogs", adherenceLogs);
        appendSuiteEvent(state, "ADHERENCE", "Adherence updated to " + point.get("adherence") + "%");
        return saveState(user, state);
    }

    public Map<String, Object> addFamilyMember(User user, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> familyMembers = getList(state, "familyMembers");

        String name = String.valueOf(payload.getOrDefault("name", "")).trim();
        if (name.isEmpty()) {
            throw new RuntimeException("Family member name is required");
        }

        Map<String, Object> member = new LinkedHashMap<>();
        member.put("id", nextId());
        member.put("name", name);
        member.put("relation", String.valueOf(payload.getOrDefault("relation", "Member")));
        member.put("condition", String.valueOf(payload.getOrDefault("condition", "General Wellness")));
        member.put("risk", String.valueOf(payload.getOrDefault("risk", "Low")));
        member.put("createdAt", LocalDateTime.now().toString());
        familyMembers.add(member);

        state.put("familyMembers", familyMembers);
        appendSuiteEvent(state, "FAMILY_ADD", "Added family member: " + name);
        return saveState(user, state);
    }

    public Map<String, Object> updateFamilyMember(User user, Long memberId, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> familyMembers = getList(state, "familyMembers");

        for (Map<String, Object> member : familyMembers) {
            if (Objects.equals(getLong(member.get("id")), memberId)) {
                if (payload.containsKey("name")) {
                    member.put("name", String.valueOf(payload.get("name")));
                }
                if (payload.containsKey("relation")) {
                    member.put("relation", String.valueOf(payload.get("relation")));
                }
                if (payload.containsKey("condition")) {
                    member.put("condition", String.valueOf(payload.get("condition")));
                }
                if (payload.containsKey("risk")) {
                    member.put("risk", String.valueOf(payload.get("risk")));
                }
                appendSuiteEvent(state, "FAMILY_EDIT", "Updated family member: " + member.get("name"));
                break;
            }
        }

        state.put("familyMembers", familyMembers);
        return saveState(user, state);
    }

    public Map<String, Object> removeFamilyMember(User user, Long memberId) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> familyMembers = getList(state, "familyMembers");
        String removedName = familyMembers.stream()
                .filter(member -> Objects.equals(getLong(member.get("id")), memberId))
                .map(member -> String.valueOf(member.getOrDefault("name", "Member")))
                .findFirst()
                .orElse("Member");
        familyMembers.removeIf(member -> Objects.equals(getLong(member.get("id")), memberId));
        state.put("familyMembers", familyMembers);
        appendSuiteEvent(state, "FAMILY_REMOVE", "Removed family member: " + removedName);
        return saveState(user, state);
    }

    public Map<String, Object> addMedication(User user, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> medications = getList(state, "medications");

        String name = String.valueOf(payload.getOrDefault("name", "")).trim();
        if (name.isEmpty()) {
            throw new RuntimeException("Medication name is required");
        }

        Map<String, Object> medication = new LinkedHashMap<>();
        medication.put("id", nextId());
        medication.put("name", name);
        medication.put("time", String.valueOf(payload.getOrDefault("time", "09:00 AM")));
        medication.put("taken", Boolean.parseBoolean(String.valueOf(payload.getOrDefault("taken", false))));
        medications.add(medication);

        state.put("medications", medications);
        appendSuiteEvent(state, "MEDICATION_ADD", "Added medication: " + name);
        return saveState(user, state);
    }

    public Map<String, Object> updateMedication(User user, Long medicationId, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> medications = getList(state, "medications");

        for (Map<String, Object> medication : medications) {
            if (Objects.equals(getLong(medication.get("id")), medicationId)) {
                if (payload.containsKey("name")) {
                    medication.put("name", String.valueOf(payload.get("name")));
                }
                if (payload.containsKey("time")) {
                    medication.put("time", String.valueOf(payload.get("time")));
                }
                if (payload.containsKey("taken")) {
                    medication.put("taken", Boolean.parseBoolean(String.valueOf(payload.get("taken"))));
                }
                appendSuiteEvent(state, "MEDICATION_EDIT", "Updated medication: " + medication.get("name"));
                break;
            }
        }

        state.put("medications", medications);
        return saveState(user, state);
    }

    public Map<String, Object> toggleMedication(User user, Long medicationId) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> medications = getList(state, "medications");

        for (Map<String, Object> medication : medications) {
            if (Objects.equals(getLong(medication.get("id")), medicationId)) {
                boolean current = Boolean.parseBoolean(String.valueOf(medication.getOrDefault("taken", false)));
                medication.put("taken", !current);
                break;
            }
        }

        state.put("medications", medications);
        appendSuiteEvent(state, "MEDICATION_TOGGLE", "Medication status toggled");
        return saveState(user, state);
    }

    public Map<String, Object> removeMedication(User user, Long medicationId) {
        Map<String, Object> state = getState(user);
        List<Map<String, Object>> medications = getList(state, "medications");
        String removedName = medications.stream()
                .filter(medication -> Objects.equals(getLong(medication.get("id")), medicationId))
                .map(medication -> String.valueOf(medication.getOrDefault("name", "Medication")))
                .findFirst()
                .orElse("Medication");
        medications.removeIf(medication -> Objects.equals(getLong(medication.get("id")), medicationId));
        state.put("medications", medications);
        appendSuiteEvent(state, "MEDICATION_REMOVE", "Removed medication: " + removedName);
        return saveState(user, state);
    }

    public Map<String, Object> appendMoodLog(User user, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        String mood = String.valueOf(payload.getOrDefault("mood", "calm"));
        String note = String.valueOf(payload.getOrDefault("note", ""));

        List<Map<String, Object>> moodLogs = getList(state, "moodLogs");
        Map<String, Object> log = new LinkedHashMap<>();
        log.put("id", nextId());
        log.put("mood", mood);
        log.put("note", note);
        log.put("createdAt", LocalDateTime.now().toString());
        moodLogs.add(log);
        if (moodLogs.size() > 60) {
            moodLogs = moodLogs.subList(moodLogs.size() - 60, moodLogs.size());
        }

        state.put("mood", mood);
        state.put("moodLogs", moodLogs);
        appendSuiteEvent(state, "MOOD", "Mood changed to: " + mood);
        return saveState(user, state);
    }

    public Map<String, Object> updateJournal(User user, Map<String, Object> payload) {
        Map<String, Object> state = getState(user);
        state.put("journal", String.valueOf(payload.getOrDefault("journal", "")));
        appendSuiteEvent(state, "JOURNAL", "Journal updated");
        return saveState(user, state);
    }

    private PatientSuiteState newState(User user) {
        PatientSuiteState entity = new PatientSuiteState();
        entity.setUser(user);
        entity.setStateJson(writeState(defaultState()));
        return entity;
    }

    private Map<String, Object> defaultState() {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("familyMembers", new ArrayList<>());
        state.put("moodLogs", new ArrayList<>());
        state.put("medications", new ArrayList<>());
        state.put("costEstimations", new ArrayList<>());
        state.put("adherenceLogs", new ArrayList<>());
        state.put("waitTimeLogs", new ArrayList<>());
        state.put("insuranceVarianceLogs", new ArrayList<>());
        state.put("suiteEvents", new ArrayList<>());
        state.put("journal", "");
        state.put("mood", "calm");
        state.put("lastUpdatedAt", LocalDateTime.now().toString());
        return state;
    }

    private Map<String, Object> mergeWithDefaults(Map<String, Object> incoming) {
        Map<String, Object> merged = defaultState();
        if (incoming != null) {
            merged.putAll(incoming);
        }
        return merged;
    }

    private Map<String, Object> parseState(String json) {
        if (json == null || json.isBlank()) {
            return defaultState();
        }
        try {
            return mergeWithDefaults(objectMapper.readValue(json, MAP_TYPE));
        } catch (Exception e) {
            return defaultState();
        }
    }

    private String writeState(Map<String, Object> state) {
        try {
            return objectMapper.writeValueAsString(state);
        } catch (Exception e) {
            throw new RuntimeException("Failed to persist suite state", e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getList(Map<String, Object> state, String key) {
        Object value = state.get(key);
        if (value instanceof List<?>) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object item : (List<?>) value) {
                if (!(item instanceof Map<?, ?> mapItem)) {
                    continue;
                }
                Map<String, Object> normalized = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : mapItem.entrySet()) {
                    normalized.put(String.valueOf(entry.getKey()), entry.getValue());
                }
                out.add(normalized);
            }
            return out;
        }
        return new ArrayList<>();
    }

    private List<Map<String, Object>> takeLast(List<Map<String, Object>> points, int size) {
        if (points.size() <= size) {
            return points;
        }
        return points.subList(points.size() - size, points.size());
    }

    private Map<String, Object> hospital(String name, String distance, int occupancy, int emergency, int specialist) {
        int smartScore = (int) Math.round(emergency * 0.45 + specialist * 0.40 + (100 - occupancy) * 0.15);
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", name);
        item.put("distance", distance);
        item.put("occupancy", occupancy);
        item.put("emergency", emergency);
        item.put("specialist", specialist);
        item.put("smartScore", smartScore);
        return item;
    }

    private List<Map<String, Object>> getDoctorProfiles() {
        return roleRepository.findByName(Role.RoleName.ROLE_DOCTOR)
                .map(userRepository::findByRolesContaining)
                .orElse(Collections.emptyList())
                .stream()
                .map(user -> {
                    Map<String, Object> doctor = new LinkedHashMap<>();
                    doctor.put("name", user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getUsername());
                    doctor.put("specialization", "General Physician");
                    return doctor;
                })
                .collect(Collectors.toList());
    }

    private double toDouble(Object value, double fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    private double round(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP).doubleValue();
    }

    private void appendSuiteEvent(Map<String, Object> state, String type, String message) {
        List<Map<String, Object>> events = getList(state, "suiteEvents");
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("id", nextId());
        event.put("type", type);
        event.put("message", message);
        event.put("createdAt", LocalDateTime.now().toString());
        events.add(event);
        if (events.size() > 100) {
            events = events.subList(events.size() - 100, events.size());
        }
        state.put("suiteEvents", events);
    }

    private long nextId() {
        return System.currentTimeMillis();
    }

    private Long getLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }
}
