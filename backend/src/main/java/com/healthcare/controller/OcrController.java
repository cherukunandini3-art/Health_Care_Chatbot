package com.healthcare.controller;

import com.healthcare.dto.OcrResponse;
import com.healthcare.service.OCRService;
import lombok.RequiredArgsConstructor;
import net.sourceforge.tess4j.TesseractException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * REST controller for OCR (Optical Character Recognition) operations.
 *
 * <p>
 * Endpoints:</p>
 * <ul>
 * <li>POST /api/ocr/upload — extract text from image or PDF</li>
 * <li>POST /api/ocr/extract-labs — extract text AND parse structured lab
 * values</li>
 * </ul>
 *
 * <p>
 * Requires authentication. Both PATIENT and DOCTOR roles are permitted.</p>
 *
 * <p>
 * <strong>Postman test:</strong></p>
 * <pre>
 *   Method : POST
 *   URL    : http://localhost:8080/api/ocr/upload
 *   Auth   : Bearer &lt;JWT token&gt;
 *   Body   : form-data
 *              key  = file   (type = File)
 *              value= &lt;select your image or PDF&gt;
 * </pre>
 */
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class OcrController {

    private static final Logger log = LoggerFactory.getLogger(OcrController.class);

    private final OCRService ocrService;

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/ocr/upload
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Upload an image (JPG/PNG/BMP/TIFF/GIF) or PDF and receive extracted text.
     *
     * <p>
     * Max file size: 5 MB (enforced in OcrService).</p>
     *
     * @param file the multipart file to process
     * @return {@link OcrResponse} with extractedText, character count, and file
     * type
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<OcrResponse> uploadAndExtract(
            @RequestParam("file") MultipartFile file) {

        log.info("OCR upload request — filename: '{}', size: {} bytes, contentType: {}",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        try {
            // Validate before heavy processing
            ocrService.validateFile(file);

            String extractedText = ocrService.extractText(file);
            String fileType = ocrService.isPdfFile(file) ? "PDF" : "IMAGE";

            OcrResponse response = OcrResponse.builder()
                    .success(true)
                    .extractedText(extractedText)
                    .message("OCR completed successfully.")
                    .fileType(fileType)
                    .characterCount(extractedText.length())
                    .build();

            log.info("OCR completed — {} chars extracted from {} file '{}'",
                    extractedText.length(), fileType, file.getOriginalFilename());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("OCR validation failed for '{}': {}", file.getOriginalFilename(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());

        } catch (TesseractException e) {
            log.error("Tesseract OCR engine error for '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message("OCR engine error: " + e.getMessage()
                                    + ". Please ensure Tesseract is installed at the configured path.")
                            .build());

        } catch (IOException e) {
            log.error("I/O error processing '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message("File processing error: " + e.getMessage())
                            .build());

        } catch (Exception e) {
            log.error("Unexpected error during OCR for '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message("Unexpected error. Please try again.")
                            .build());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/ocr/extract-labs
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Upload a medical report image/PDF and receive both raw text and
     * structured lab values (Glucose, HbA1c, Creatinine, etc.).
     *
     * <p>
     * Response example:</p>
     * <pre>
     * {
     *   "success": true,
     *   "extractedText": "Glucose: 180 mg/dL\nHbA1c: 7.8%\n...",
     *   "message": "OCR and lab extraction completed.",
     *   "fileType": "IMAGE",
     *   "characterCount": 342,
     *   "labValues": {
     *     "Glucose": "180 mg/dL",
     *     "HbA1c": "7.8%"
     *   }
     * }
     * </pre>
     *
     * @param file the multipart file to process
     * @return {@link OcrResponse} including lab value map
     */
    @PostMapping("/extract-labs")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<OcrResponse> uploadAndExtractLabs(
            @RequestParam("file") MultipartFile file) {

        log.info("OCR lab-extract request — filename: '{}', size: {} bytes",
                file.getOriginalFilename(), file.getSize());

        try {
            ocrService.validateFile(file);

            String extractedText = ocrService.extractText(file);
            Map<String, String> labValues = ocrService.extractLabValues(extractedText);
            String fileType = ocrService.isPdfFile(file) ? "PDF" : "IMAGE";

            OcrResponse response = OcrResponse.builder()
                    .success(true)
                    .extractedText(extractedText)
                    .message("OCR and lab extraction completed. Found " + labValues.size() + " lab value(s).")
                    .fileType(fileType)
                    .characterCount(extractedText.length())
                    .labValues(labValues)
                    .build();

            log.info("Lab extraction completed — {} lab values from '{}': {}",
                    labValues.size(), file.getOriginalFilename(), labValues.keySet());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Lab-extract validation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());

        } catch (TesseractException e) {
            log.error("Tesseract engine error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message("OCR engine error: " + e.getMessage())
                            .build());

        } catch (IOException e) {
            log.error("I/O error during lab extraction: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message("File processing error: " + e.getMessage())
                            .build());

        } catch (Exception e) {
            log.error("Unexpected error during lab extraction: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OcrResponse.builder()
                            .success(false)
                            .message("Unexpected error. Please try again.")
                            .build());
        }
    }
}
