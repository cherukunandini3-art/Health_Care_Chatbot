package com.healthcare.service;

import com.healthcare.model.MedicalReport;
import com.healthcare.model.User;
import com.healthcare.repository.MedicalReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing medical reports and OCR processing
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MedicalReportService {

    private final MedicalReportRepository medicalReportRepository;
    private final OCRService ocrService;
    private final OpenAIService openAIService;

    @Value("${upload.directory}")
    private String uploadDirectory;

    /**
     * Upload and process medical report
     */
    @Transactional
    public MedicalReport uploadReport(MultipartFile file, User user) {
        try {
            // Validate file
            try {
                ocrService.validateFile(file);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException(e.getMessage());
            }

            // Create upload directory if not exists
            Path uploadPath = Paths.get(uploadDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            String filePath = uploadDirectory + uniqueFilename;

            // Save file
            Files.copy(file.getInputStream(), Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);

            // Extract text using OCR
            log.info("Starting OCR extraction for file: {}", uniqueFilename);
            String extractedText = ocrService.processFile(file, filePath);

            // Generate AI explanation
            log.info("Generating AI explanation for extracted text");
            String aiExplanation = "";
            if (extractedText != null && !extractedText.startsWith("Error")) {
                aiExplanation = openAIService.generateReportExplanation(extractedText);
            }

            // Create medical report record
            MedicalReport report = new MedicalReport();
            report.setUser(user);
            report.setFileName(originalFilename);
            report.setFilePath(filePath);
            report.setFileType(file.getContentType());
            report.setExtractedText(extractedText);
            report.setAiExplanation(aiExplanation);
            report.setReportDate(LocalDateTime.now());

            return medicalReportRepository.save(report);

        } catch (IOException e) {
            log.error("Error saving uploaded file", e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Get all reports for a user
     */
    public List<MedicalReport> getUserReports(User user) {
        return medicalReportRepository.findByUserOrderByUploadedAtDesc(user);
    }

    /**
     * Get report by ID
     */
    public MedicalReport getReportById(Long reportId, User user) {
        MedicalReport report = medicalReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        // Verify report belongs to user or user is a doctor
        if (!report.getUser().getId().equals(user.getId())
                && user.getRoles().stream().noneMatch(r -> r.getName().name().equals("ROLE_DOCTOR"))) {
            throw new RuntimeException("Unauthorized access to report");
        }

        return report;
    }

    /**
     * Delete report
     */
    @Transactional
    public void deleteReport(Long reportId, User user) {
        MedicalReport report = medicalReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if (!report.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this report");
        }

        // Delete physical file
        try {
            File file = new File(report.getFilePath());
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            log.error("Error deleting physical file", e);
        }

        // Delete database record
        medicalReportRepository.delete(report);
    }
}
