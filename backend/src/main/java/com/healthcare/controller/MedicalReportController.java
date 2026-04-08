package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.model.MedicalReport;
import com.healthcare.model.User;
import com.healthcare.service.AuthService;
import com.healthcare.service.MedicalReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller for medical report operations
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class MedicalReportController {
    
    private final MedicalReportService medicalReportService;
    private final AuthService authService;
    
    /**
     * Upload medical report
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> uploadReport(@RequestParam("file") MultipartFile file) {
        try {
            User currentUser = authService.getCurrentUser();
            MedicalReport report = medicalReportService.uploadReport(file, currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Report uploaded successfully", report));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
    
    /**
     * Get all reports for current user
     */
    @GetMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getUserReports() {
        try {
            User currentUser = authService.getCurrentUser();
            List<MedicalReport> reports = medicalReportService.getUserReports(currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Reports retrieved", reports));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
    
    /**
     * Get report by ID
     */
    @GetMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<?> getReportById(@PathVariable Long reportId) {
        try {
            User currentUser = authService.getCurrentUser();
            MedicalReport report = medicalReportService.getReportById(reportId, currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Report retrieved", report));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
    
    /**
     * Delete report
     */
    @DeleteMapping("/{reportId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> deleteReport(@PathVariable Long reportId) {
        try {
            User currentUser = authService.getCurrentUser();
            medicalReportService.deleteReport(reportId, currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Report deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
