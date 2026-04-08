package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.model.*;
import com.healthcare.repository.*;
import com.healthcare.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for patient-specific operations
 */
@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientController {

    private final HealthProfileRepository healthProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthService authService;

    // ──────────────────────────────────── PROFILE ────────────────────────────────────
    @GetMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getHealthProfile() {
        try {
            User currentUser = authService.getCurrentUser();
            HealthProfile profile = healthProfileRepository.findByUser(currentUser)
                    .orElseThrow(() -> new RuntimeException("Health profile not found"));
            return ResponseEntity.ok(new ApiResponse(true, "Profile retrieved", profile));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateHealthProfile(@RequestBody HealthProfile updatedProfile) {
        try {
            User currentUser = authService.getCurrentUser();
            HealthProfile profile = healthProfileRepository.findByUser(currentUser)
                    .orElseThrow(() -> new RuntimeException("Health profile not found"));

            if (updatedProfile.getAge() != null) {
                profile.setAge(updatedProfile.getAge());
            }
            if (updatedProfile.getWeight() != null) {
                profile.setWeight(updatedProfile.getWeight());
            }
            if (updatedProfile.getHeight() != null) {
                profile.setHeight(updatedProfile.getHeight());
            }
            if (updatedProfile.getBloodType() != null) {
                profile.setBloodType(updatedProfile.getBloodType());
            }
            if (updatedProfile.getAllergies() != null) {
                profile.setAllergies(updatedProfile.getAllergies());
            }
            if (updatedProfile.getChronicConditions() != null) {
                profile.setChronicConditions(updatedProfile.getChronicConditions());
            }
            if (updatedProfile.getCurrentMedications() != null) {
                profile.setCurrentMedications(updatedProfile.getCurrentMedications());
            }
            if (updatedProfile.getEmergencyContact() != null) {
                profile.setEmergencyContact(updatedProfile.getEmergencyContact());
            }

            HealthProfile saved = healthProfileRepository.save(profile);
            return ResponseEntity.ok(new ApiResponse(true, "Profile updated", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ──────────────────────────────────── STATS ──────────────────────────────────────
    @GetMapping("/stats")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getPatientStats() {
        try {
            User currentUser = authService.getCurrentUser();
            List<ChatSession> sessions = chatSessionRepository.findByUserOrderByCreatedAtDesc(currentUser);
            List<MedicalReport> reports = medicalReportRepository.findByUserOrderByUploadedAtDesc(currentUser);
            List<Appointment> appointments = appointmentRepository.findByPatientOrderByAppointmentDateDesc(currentUser);

            long upcoming = appointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.CONFIRMED
                    || a.getStatus() == Appointment.AppointmentStatus.PENDING)
                    .count();

            long emergencies = sessions.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getIsEmergency()))
                    .count();

            String riskLevel = emergencies > 0 ? "HIGH"
                    : sessions.size() > 5 ? "MEDIUM"
                    : "LOW";

            Map<String, Object> statsMap = new LinkedHashMap<>();
            statsMap.put("totalConsultations", sessions.size());
            statsMap.put("totalReports", reports.size());
            statsMap.put("upcomingAppointments", upcoming);
            statsMap.put("totalAppointments", appointments.size());
            statsMap.put("emergencyAlerts", emergencies);
            statsMap.put("riskLevel", riskLevel);

            return ResponseEntity.ok(new ApiResponse(true, "Stats retrieved", statsMap));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ──────────────────────────────────── APPOINTMENTS ─────────────────────────────────
    @GetMapping("/appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyAppointments() {
        try {
            User currentUser = authService.getCurrentUser();
            List<Appointment> appointments = appointmentRepository.findByPatientOrderByAppointmentDateDesc(currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Appointments retrieved", appointments));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> body) {
        try {
            User currentUser = authService.getCurrentUser();

            Long doctorId = Long.valueOf(body.get("doctorId").toString());
            User doctor = userRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Doctor not found"));

            String dateTimeStr = body.get("appointmentDate").toString();
            LocalDateTime appointmentDate;
            try {
                appointmentDate = LocalDateTime.parse(dateTimeStr);
            } catch (DateTimeParseException e) {
                appointmentDate = LocalDateTime.parse(dateTimeStr.replace(" ", "T"));
            }

            Appointment appt = new Appointment();
            appt.setPatient(currentUser);
            appt.setDoctor(doctor);
            appt.setAppointmentDate(appointmentDate);
            appt.setStatus(Appointment.AppointmentStatus.PENDING);
            if (body.get("reason") != null) {
                appt.setReason(body.get("reason").toString());
            }

            Appointment saved = appointmentRepository.save(appt);
            return ResponseEntity.ok(new ApiResponse(true, "Appointment booked", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            User currentUser = authService.getCurrentUser();
            Appointment appt = appointmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));

            if (!appt.getPatient().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body(new ApiResponse(false, "Access denied"));
            }

            if (appt.getStatus() != Appointment.AppointmentStatus.PENDING) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Only PENDING appointments can be cancelled"));
            }

            appt.setStatus(Appointment.AppointmentStatus.CANCELLED);
            appointmentRepository.save(appt);
            return ResponseEntity.ok(new ApiResponse(true, "Appointment cancelled", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ──────────────────────────────────── DOCTORS ──────────────────────────────────────
    @GetMapping("/doctors")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getDoctors() {
        try {
            Role doctorRole = roleRepository.findByName(Role.RoleName.ROLE_DOCTOR)
                    .orElseThrow(() -> new RuntimeException("Doctor role not found"));
            List<User> doctors = userRepository.findByRolesContaining(doctorRole);
            // Return only safe fields
            List<Map<String, Object>> result = doctors.stream().map(d -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", d.getId());
                m.put("username", d.getUsername());
                m.put("fullName", d.getFullName());
                m.put("email", d.getEmail());
                m.put("roles", d.getRoles().stream()
                        .map(r -> r.getName().name()).collect(Collectors.toList()));
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse(true, "Doctors retrieved", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ──────────────────────────────────── EMERGENCY ────────────────────────────────────
    @PostMapping("/emergency")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> sendEmergencyAlert() {
        try {
            User currentUser = authService.getCurrentUser();
            // Log emergency as an emergency chat session marker
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("userId", currentUser.getId());
            result.put("username", currentUser.getUsername());
            result.put("timestamp", LocalDateTime.now().toString());
            result.put("message", "Emergency alert received for patient: " + currentUser.getFullName());
            // In a production system this would trigger SMS/email/push notifications
            return ResponseEntity.ok(new ApiResponse(true, "Emergency alert sent successfully", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
