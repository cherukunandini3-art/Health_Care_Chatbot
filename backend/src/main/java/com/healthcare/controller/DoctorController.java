package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.model.Appointment;
import com.healthcare.model.MedicalReport;
import com.healthcare.model.User;
import com.healthcare.repository.AppointmentRepository;
import com.healthcare.repository.MedicalReportRepository;
import com.healthcare.repository.UserRepository;
import com.healthcare.service.AuthService;
import com.healthcare.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for doctor operations
 */
@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DoctorController {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final OpenAIService openAIService;
    private final AuthService authService;

    /**
     * Get all unique patients for this doctor (derived from appointments)
     */
    @GetMapping("/patients")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyPatients() {
        try {
            User currentUser = authService.getCurrentUser();
            List<Appointment> appointments = appointmentRepository.findByDoctorOrderByAppointmentDateDesc(currentUser);
            // Deduplicate patients
            Map<Long, Map<String, Object>> patientMap = new LinkedHashMap<>();
            for (Appointment appt : appointments) {
                User p = appt.getPatient();
                if (p == null) {
                    continue;
                }
                patientMap.computeIfAbsent(p.getId(), k -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("username", p.getUsername());
                    m.put("fullName", p.getFullName());
                    m.put("email", p.getEmail());
                    m.put("phoneNumber", p.getPhoneNumber());
                    m.put("appointmentCount", 0L);
                    return m;
                });
                patientMap.get(p.getId()).merge("appointmentCount", 1L, (a, b) -> (long) a + (long) b);
            }
            return ResponseEntity.ok(new ApiResponse(true, "Patients retrieved", new ArrayList<>(patientMap.values())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get doctor dashboard stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDoctorStats() {
        try {
            User currentUser = authService.getCurrentUser();
            List<Appointment> appointments = appointmentRepository.findByDoctorOrderByAppointmentDateDesc(currentUser);
            long pending = appointments.stream().filter(a -> a.getStatus() == Appointment.AppointmentStatus.PENDING).count();
            long confirmed = appointments.stream().filter(a -> a.getStatus() == Appointment.AppointmentStatus.CONFIRMED).count();
            long completed = appointments.stream().filter(a -> a.getStatus() == Appointment.AppointmentStatus.COMPLETED).count();
            long cancelled = appointments.stream().filter(a -> a.getStatus() == Appointment.AppointmentStatus.CANCELLED).count();
            long uniquePatients = appointments.stream().map(a -> a.getPatient() != null ? a.getPatient().getId() : null)
                    .filter(Objects::nonNull).distinct().count();
            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalAppointments", appointments.size());
            stats.put("pending", pending);
            stats.put("confirmed", confirmed);
            stats.put("completed", completed);
            stats.put("cancelled", cancelled);
            stats.put("totalPatients", uniquePatients);
            return ResponseEntity.ok(new ApiResponse(true, "Stats retrieved", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all appointments for the doctor
     */
    @GetMapping("/appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDoctorAppointments() {
        try {
            User currentUser = authService.getCurrentUser();
            List<Appointment> appointments = appointmentRepository.findByDoctorOrderByAppointmentDateDesc(currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Appointments retrieved", appointments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get patient details and history
     */
    @GetMapping("/patients/{patientId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientDetails(@PathVariable Long patientId) {
        try {
            User patient = userRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("patient", patient);
            response.put("healthProfile", patient.getHealthProfile());

            return ResponseEntity.ok(new ApiResponse(true, "Patient details retrieved", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get patient medical reports
     */
    @GetMapping("/patients/{patientId}/reports")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientReports(@PathVariable Long patientId) {
        try {
            User patient = userRepository.findById(patientId)
                    .orElseThrow(() -> new RuntimeException("Patient not found"));

            List<MedicalReport> reports = medicalReportRepository.findByUserOrderByUploadedAtDesc(patient);
            return ResponseEntity.ok(new ApiResponse(true, "Reports retrieved", reports));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Generate SOAP note draft
     */
    @PostMapping("/soap-note")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> generateSoapNote(@RequestBody Map<String, String> request) {
        try {
            String patientHistory = request.get("patientHistory");
            String symptoms = request.get("symptoms");

            String soapNote = openAIService.generateSoapNote(patientHistory, symptoms);

            Map<String, String> response = new HashMap<>();
            response.put("soapNote", soapNote);

            return ResponseEntity.ok(new ApiResponse(true, "SOAP note generated", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Update appointment
     */
    @PutMapping("/appointments/{appointmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateAppointment(
            @PathVariable Long appointmentId,
            @RequestBody Appointment updatedAppointment
    ) {
        try {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));

            if (updatedAppointment.getStatus() != null) {
                appointment.setStatus(updatedAppointment.getStatus());
            }
            if (updatedAppointment.getNotes() != null) {
                appointment.setNotes(updatedAppointment.getNotes());
            }
            if (updatedAppointment.getSoapNote() != null) {
                appointment.setSoapNote(updatedAppointment.getSoapNote());
            }

            Appointment saved = appointmentRepository.save(appointment);
            return ResponseEntity.ok(new ApiResponse(true, "Appointment updated", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
