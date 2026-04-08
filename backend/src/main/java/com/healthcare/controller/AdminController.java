package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.model.Appointment;
import com.healthcare.model.ChatSession;
import com.healthcare.model.Role;
import com.healthcare.model.User;
import com.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for admin operations
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            // User statistics
            List<User> allUsers = userRepository.findAll();
            stats.put("totalUsers", allUsers.size());
            stats.put("totalPatients", allUsers.stream()
                    .filter(u -> u.getRoles().stream()
                    .anyMatch(r -> r.getName() == Role.RoleName.ROLE_PATIENT))
                    .count());
            stats.put("totalDoctors", allUsers.stream()
                    .filter(u -> u.getRoles().stream()
                    .anyMatch(r -> r.getName() == Role.RoleName.ROLE_DOCTOR))
                    .count());

            // Chat statistics
            stats.put("totalChatSessions", chatSessionRepository.count());
            stats.put("totalMessages", messageRepository.countAllMessages());
            stats.put("emergencySessions", chatSessionRepository.countEmergencySessions());

            // Appointment statistics
            stats.put("totalAppointments", appointmentRepository.countAllAppointments());
            stats.put("pendingAppointments", appointmentRepository.countPendingAppointments());

            // Report statistics
            stats.put("totalReports", medicalReportRepository.count());
            stats.put("ocrProcessed", medicalReportRepository.count());

            // Get recent user messages for common symptoms analysis
            List<String> recentMessages = messageRepository.findRecentUserMessages();
            stats.put("recentSymptoms", analyzeCommonSymptoms(recentMessages));

            return ResponseEntity.ok(new ApiResponse(true, "Dashboard stats retrieved", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all users
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(new ApiResponse(true, "Users retrieved", users));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Toggle user active status
     */
    @PutMapping("/users/{userId}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setIsActive(!user.getIsActive());
            User savedUser = userRepository.save(user);

            return ResponseEntity.ok(new ApiResponse(true, "User status updated", savedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Delete a user
     */
    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userRepository.deleteById(userId);
            return ResponseEntity.ok(new ApiResponse(true, "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Create a doctor account
     */
    @PostMapping("/users/create-doctor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createDoctor(@RequestBody Map<String, String> body) {
        try {
            String username = body.get("username");
            String email = body.get("email");
            String password = body.get("password");
            String fullName = body.get("fullName");
            String phoneNumber = body.get("phoneNumber");

            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Username is already taken"));
            }
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Email is already in use"));
            }

            User doctor = new User();
            doctor.setUsername(username);
            doctor.setEmail(email);
            doctor.setPassword(passwordEncoder.encode(password));
            doctor.setFullName(fullName);
            doctor.setPhoneNumber(phoneNumber);
            doctor.setIsActive(true);

            Role doctorRole = roleRepository.findByName(Role.RoleName.ROLE_DOCTOR)
                    .orElseThrow(() -> new RuntimeException("Doctor role not found"));
            doctor.setRoles(new HashSet<>(Collections.singleton(doctorRole)));

            userRepository.save(doctor);
            return ResponseEntity.ok(new ApiResponse(true, "Doctor account created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all chat sessions
     */
    @GetMapping("/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllSessions() {
        try {
            var sessions = chatSessionRepository.findAllOrderByLastMessageAtDesc();
            List<Map<String, Object>> result = sessions.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("title", s.getTitle());
                m.put("username", s.getUser().getUsername());
                m.put("isEmergency", s.getIsEmergency());
                m.put("isActive", s.getIsActive());
                m.put("lastMessageAt", s.getLastMessageAt());
                m.put("createdAt", s.getCreatedAt());
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse(true, "Sessions retrieved", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all appointments (admin view)
     */
    @GetMapping("/appointments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAppointments() {
        try {
            List<Appointment> appointments = appointmentRepository.findAll();
            return ResponseEntity.ok(new ApiResponse(true, "Appointments retrieved", appointments));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Update appointment status (approve / reject)
     */
    @PutMapping("/appointments/{appointmentId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> body) {
        try {
            Appointment appt = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));
            String status = body.get("status");
            appt.setStatus(Appointment.AppointmentStatus.valueOf(status));
            appointmentRepository.save(appt);
            return ResponseEntity.ok(new ApiResponse(true, "Appointment status updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get messages for a specific session
     */
    @GetMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSessionMessages(@PathVariable Long sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            var messages = messageRepository.findByChatSessionOrderByCreatedAtAsc(session);
            return ResponseEntity.ok(new ApiResponse(true, "Messages retrieved", messages));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Flag a chat session
     */
    @PutMapping("/sessions/{sessionId}/flag")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> flagSession(@PathVariable Long sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            // Mark as emergency/flagged
            session.setIsEmergency(true);
            chatSessionRepository.save(session);
            return ResponseEntity.ok(new ApiResponse(true, "Session flagged"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Analyze common symptoms from messages
     */
    private Map<String, Integer> analyzeCommonSymptoms(List<String> messages) {
        Map<String, Integer> symptomCount = new HashMap<>();

        String[] commonSymptoms = {
            "headache", "fever", "cough", "cold", "pain", "nausea",
            "fatigue", "dizziness", "shortness of breath", "chest pain"
        };

        // Limit to first 100 messages for performance
        List<String> limitedMessages = messages.stream()
                .limit(100)
                .collect(Collectors.toList());

        for (String symptom : commonSymptoms) {
            long count = limitedMessages.stream()
                    .filter(msg -> msg.toLowerCase().contains(symptom))
                    .count();
            if (count > 0) {
                symptomCount.put(symptom, (int) count);
            }
        }

        return symptomCount;
    }
}
