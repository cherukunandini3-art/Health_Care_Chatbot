package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.model.User;
import com.healthcare.service.AuthService;
import com.healthcare.service.PatientSuiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patient/suite")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientSuiteController {

    private final PatientSuiteService patientSuiteService;
    private final AuthService authService;

    @GetMapping("/state")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getState() {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Suite state retrieved", patientSuiteService.getState(currentUser)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/state")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> saveState(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Suite state saved", patientSuiteService.saveState(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/family-members")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> addFamilyMember(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Family member added", patientSuiteService.addFamilyMember(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/family-members/{memberId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> removeFamilyMember(@PathVariable Long memberId) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Family member removed", patientSuiteService.removeFamilyMember(currentUser, memberId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/family-members/{memberId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateFamilyMember(@PathVariable Long memberId, @RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Family member updated", patientSuiteService.updateFamilyMember(currentUser, memberId, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/medications")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> addMedication(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Medication added", patientSuiteService.addMedication(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PatchMapping("/medications/{medicationId}/toggle")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> toggleMedication(@PathVariable Long medicationId) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Medication toggled", patientSuiteService.toggleMedication(currentUser, medicationId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/medications/{medicationId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> removeMedication(@PathVariable Long medicationId) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Medication removed", patientSuiteService.removeMedication(currentUser, medicationId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/medications/{medicationId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateMedication(@PathVariable Long medicationId, @RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Medication updated", patientSuiteService.updateMedication(currentUser, medicationId, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/mood")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> appendMood(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Mood updated", patientSuiteService.appendMoodLog(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/journal")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateJournal(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Journal updated", patientSuiteService.updateJournal(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/estimate")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> estimate(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Cost estimation calculated", patientSuiteService.estimateCost(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/adherence")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> appendAdherence(@RequestBody Map<String, Object> payload) {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Adherence log updated", patientSuiteService.appendAdherenceLog(currentUser, payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/charts")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> charts() {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Suite charts retrieved", patientSuiteService.getCharts(currentUser)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/optimized-slots")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> optimizedSlots() {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Optimized slots retrieved", patientSuiteService.getOptimizedSlots(currentUser)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/hospital-insights")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> hospitalInsights() {
        try {
            return ResponseEntity.ok(new ApiResponse(true, "Hospital intelligence retrieved", patientSuiteService.getHospitalInsights()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/events")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> events() {
        try {
            User currentUser = authService.getCurrentUser();
            return ResponseEntity.ok(new ApiResponse(true, "Suite events retrieved", patientSuiteService.getRecentEvents(currentUser)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
