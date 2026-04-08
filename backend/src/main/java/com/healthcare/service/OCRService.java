package com.healthcare.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OCR Service using Tesseract (via Tess4J) with optional PDF support (PDFBox).
 * <p>
 * Supports: JPG, PNG, BMP, GIF, TIFF, PDF (first page)
 * </p>
 */
@Service
public class OCRService {

    private static final Logger log = LoggerFactory.getLogger(OCRService.class);

    /**
     * Allowed MIME types
     */
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/bmp", "image/tiff", "image/gif",
            "application/pdf"
    );

    /**
     * Allowed file extensions
     */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "bmp", "tiff", "tif", "gif", "pdf"
    );

    /**
     * Maximum file size: 10 MB (matches spring.servlet.multipart.max-file-size)
     */
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @Value("${tesseract.data.path:C:/Program Files/Tesseract-OCR/tessdata}")
    private String tesseractDataPath;

    // ─────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────
    /**
     * Validate and extract text from an uploaded MultipartFile. Automatically
     * detects image vs PDF and routes accordingly. Temporary files are always
     * cleaned up after processing.
     */
    public String extractText(MultipartFile file) throws IOException, TesseractException {
        validateFile(file);

        Path tempDir = Files.createTempDirectory("ocr_");
        File tempFile = tempDir.resolve(
                Objects.requireNonNull(file.getOriginalFilename(), "filename")).toFile();
        try {
            file.transferTo(tempFile);
            log.info("Processing OCR for '{}' ({} bytes)", file.getOriginalFilename(), file.getSize());
            return isPdfFile(file) ? extractFromPdf(tempFile) : extractFromImage(tempFile);
        } finally {
            deleteSilently(tempFile);
            deleteSilently(tempDir.toFile());
        }
    }

    /**
     * Extract structured lab values from raw OCR text using regex.
     *
     * <p>
     * Example input: "Glucose: 180 mg/dL\nHbA1c: 7.8%"</p>
     * <p>
     * Returns: {"Glucose" → "180 mg/dL", "HbA1c" → "7.8%"}</p>
     */
    public Map<String, String> extractLabValues(String rawText) {
        Map<String, String> labValues = new LinkedHashMap<>();

        List<String> knownLabels = List.of(
                "Glucose", "HbA1c", "Hemoglobin", "Hematocrit", "WBC", "RBC",
                "Platelets", "MCV", "MCH", "MCHC", "Sodium", "Potassium",
                "Chloride", "Bicarbonate", "BUN", "Creatinine", "eGFR",
                "AST", "ALT", "ALP", "Total Bilirubin", "Albumin",
                "Total Cholesterol", "LDL", "HDL", "Triglycerides",
                "TSH", "T3", "T4", "Calcium", "Magnesium", "Phosphorus",
                "Iron", "Ferritin", "Vitamin D", "Vitamin B12", "Folate",
                "PSA", "CRP", "ESR", "PT", "INR", "aPTT",
                "pH", "pCO2", "pO2", "HCO3", "O2 Saturation",
                "Blood Pressure", "Heart Rate", "Temperature", "Pulse", "SpO2",
                "Weight", "Height", "BMI"
        );

        for (String label : knownLabels) {
            Pattern p = Pattern.compile(
                    "(?i)\\b" + Pattern.quote(label)
                    + "\\s*[:\\-]?\\s*(\\d+\\.?\\d*(?:\\s*[a-zA-Z/%]+(?:/[a-zA-Z]+)*)?)",
                    Pattern.MULTILINE);
            Matcher m = p.matcher(rawText);
            if (m.find()) {
                labValues.put(label, m.group(1).trim());
            }
        }

        // Fallback: generic extraction when no known label matches
        if (labValues.isEmpty()) {
            Pattern generic = Pattern.compile(
                    "([A-Za-z][A-Za-z0-9\\s/()%]+?)\\s*[:\\-]?\\s*(\\d+\\.?\\d*\\s*[a-zA-Z/%]+(?:/[a-zA-Z]+)*)",
                    Pattern.MULTILINE);
            Matcher gm = generic.matcher(rawText);
            while (gm.find()) {
                String key = gm.group(1).trim();
                String val = gm.group(2).trim();
                if (key.length() <= 40 && !key.isBlank()) {
                    labValues.put(key, val);
                }
            }
        }

        log.info("Extracted {} lab value(s) from OCR text", labValues.size());
        return labValues;
    }

    // ─────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size (" + (file.getSize() / 1024) + " KB) exceeds maximum allowed 5 MB.");
        }
        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Unsupported file extension '." + ext + "'. Allowed: jpg, jpeg, png, bmp, tiff, gif, pdf");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.equals("application/octet-stream")
                && !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported content type '" + contentType + "'.");
        }
    }

    public boolean isPdfFile(MultipartFile file) {
        String ct = file.getContentType();
        return "pdf".equalsIgnoreCase(getExtension(file.getOriginalFilename()))
                || (ct != null && ct.equalsIgnoreCase("application/pdf"));
    }

    // ─────────────────────────────────────────────────────────
    // OCR Core
    // ─────────────────────────────────────────────────────────
    private String extractFromImage(File imageFile) throws TesseractException, IOException {
        BufferedImage original = ImageIO.read(imageFile);
        if (original == null) {
            throw new IOException("Cannot read image: " + imageFile.getName());
        }
        BufferedImage processed = preprocessImage(original);
        String text = buildTesseract().doOCR(processed);
        log.debug("Image OCR result: {} chars", text == null ? 0 : text.length());
        return cleanText(text);
    }

    private String extractFromPdf(File pdfFile) throws IOException, TesseractException {
        log.info("Converting first PDF page to image for OCR: {}", pdfFile.getName());
        try (PDDocument doc = PDDocument.load(pdfFile)) {
            if (doc.getNumberOfPages() == 0) {
                throw new IllegalArgumentException("PDF has no pages.");
            }
            BufferedImage pageImage = new PDFRenderer(doc).renderImageWithDPI(0, 300);
            BufferedImage processed = preprocessImage(pageImage);
            String text = buildTesseract().doOCR(processed);
            log.debug("PDF OCR result: {} chars", text == null ? 0 : text.length());
            return cleanText(text);
        }
    }

    // ─────────────────────────────────────────────────────────
    // Image Preprocessing
    // ─────────────────────────────────────────────────────────
    /**
     * Convert to grayscale and enhance contrast to improve Tesseract accuracy.
     */
    private BufferedImage preprocessImage(BufferedImage original) {
        // Step 1: grayscale
        BufferedImage gray = new BufferedImage(
                original.getWidth(), original.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(original, 0, 0, null);
        g.dispose();

        // Step 2: contrast enhancement via RescaleOp
        java.awt.image.RescaleOp rescale = new java.awt.image.RescaleOp(
                new float[]{1.5f}, new float[]{-30f}, null);
        return rescale.filter(gray, null);
    }

    // ─────────────────────────────────────────────────────────
    // Tesseract Factory
    // ─────────────────────────────────────────────────────────
    private Tesseract buildTesseract() {
        Tesseract t = new Tesseract();
        t.setDatapath(tesseractDataPath);
        t.setLanguage("eng");
        t.setPageSegMode(3);   // Fully automatic page segmentation, no OSD
        t.setOcrEngineMode(1); // LSTM engine only (more accurate)
        log.debug("Tesseract configured — datapath: {}", tesseractDataPath);
        return t;
    }

    // ─────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────
    private String cleanText(String text) {
        if (text == null || text.isBlank()) {
            return "No text could be extracted from the file.";
        }
        // Collapse 3+ consecutive blank lines → single blank line
        text = text.replaceAll("(\n\\s*){3,}", "\n\n");
        // Fix pipe → I (common OCR artefact)
        text = text.replaceAll("\\|", "I");
        return text.trim();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private void deleteSilently(File f) {
        try {
            if (f != null && f.exists()) {
                if (f.isDirectory()) {
                    File[] children = f.listFiles();
                    if (children != null) {
                        Arrays.stream(children).forEach(this::deleteSilently);
                    }
                }
                if (!f.delete()) {
                    log.warn("Could not delete temp path: {}", f.getAbsolutePath());
                }
            }
        } catch (Exception e) {
            log.warn("Error deleting temp path {}: {}", f, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────
    // Legacy adapter methods (used by MedicalReportService)
    // ─────────────────────────────────────────────────────────
    /**
     * Returns true if the file is a supported image or PDF type. Alias for
     * validateFile() that returns boolean instead of throwing.
     */
    public boolean isValidFile(MultipartFile file) {
        try {
            validateFile(file);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Adapter: extract text from an already-saved file on disk. Used by
     * MedicalReportService after it has written the file to storage.
     */
    public String processFile(MultipartFile file, String savedFilePath) {
        try {
            File savedFile = new File(savedFilePath);
            boolean isPdf = isPdfFile(file);
            String text = isPdf ? extractFromPdf(savedFile) : extractFromImage(savedFile);
            return cleanText(text);
        } catch (Exception e) {
            log.error("Error processing saved file '{}': {}", savedFilePath, e.getMessage(), e);
            return "Error: Unable to extract text from file.";
        }
    }
}
