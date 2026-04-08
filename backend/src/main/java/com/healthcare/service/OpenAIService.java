package com.healthcare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.dto.ChatResponse;
import com.healthcare.model.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for AI integration — supports Ollama (local) and OpenAI
 */
@Service
@Slf4j
public class OpenAIService {

    // OpenAI fallback
    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model}")
    private String openAiModel;

    // Ollama config
    @Value("${ollama.enabled:false}")
    private boolean ollamaEnabled;

    @Value("${ollama.base.url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3:latest}")
    private String ollamaModel;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Emergency keywords for triage
    private static final String[] EMERGENCY_KEYWORDS = {
        "chest pain", "heart attack", "can't breathe", "difficulty breathing",
        "severe bleeding", "suicide", "suicidal", "stroke", "unconscious",
        "severe headache", "can't move", "paralysis", "seizure"
    };

    public OpenAIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Public entry for LocationChatService — calls Ollama or OpenAI
     */
    public String callOllama(List<Map<String, String>> messages) throws Exception {
        return callOpenAI(messages, 400);
    }

    /**
     * Check if message contains emergency keywords
     */
    public boolean isEmergency(String message) {
        String lowerMessage = message.toLowerCase();
        for (String keyword : EMERGENCY_KEYWORDS) {
            if (lowerMessage.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate emergency response
     */
    public ChatResponse generateEmergencyResponse() {
        ChatResponse response = new ChatResponse();
        response.setIsEmergency(true);
        response.setResponse("⚠️ EMERGENCY ALERT ⚠️\n\n"
                + "Your message contains keywords indicating a potential medical emergency.\n\n"
                + "IMMEDIATE ACTIONS:\n"
                + "🚨 Call emergency services (911) immediately\n"
                + "🏥 Go to the nearest emergency room\n"
                + "📞 Contact your doctor or healthcare provider\n\n"
                + "Do not rely on this chat for emergency medical situations. "
                + "This is an AI assistant and cannot provide emergency medical care.");

        ChatResponse.StructuredResponse structured = new ChatResponse.StructuredResponse();
        structured.setSeverityLevel("CRITICAL - EMERGENCY");
        structured.setRecommendedAction("Seek immediate medical attention by calling 911");
        structured.setDisclaimer("This is not a substitute for professional medical advice");
        response.setStructuredResponse(structured);

        return response;
    }

    /**
     * Generate AI response with conversation context
     */
    public ChatResponse generateChatResponse(String userMessage, List<Message> conversationHistory, String healthContext) {
        try {
            // Build conversation messages
            List<Map<String, String>> messages = new ArrayList<>();

            // System prompt with health context
            String systemPrompt = buildSystemPrompt(healthContext);
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Add conversation history (last 10 messages for context)
            int startIndex = Math.max(0, conversationHistory.size() - 10);
            for (int i = startIndex; i < conversationHistory.size(); i++) {
                Message msg = conversationHistory.get(i);
                messages.add(Map.of(
                        "role", msg.getRole() == Message.MessageRole.USER ? "user" : "assistant",
                        "content", msg.getContent()
                ));
            }

            // Add current user message
            messages.add(Map.of("role", "user", "content", userMessage));

            // Call OpenAI API
            String apiResponse = callOpenAI(messages);
            apiResponse = sanitizeMedicalResponse(userMessage, apiResponse);

            // Parse and structure response
            return parseStructuredResponse(apiResponse);

        } catch (Exception e) {
            log.error("Error generating AI response", e);
            return createErrorResponse(e.getMessage());
        }
    }

    /**
     * Generate explanation for OCR extracted text
     */
    public String generateReportExplanation(String extractedText) {
        try {
            if (extractedText == null || extractedText.isBlank()
                    || extractedText.contains("No text could be extracted")) {
                return "The report could not be read clearly. Please upload a clearer image or PDF.";
            }

            String prompt = "Medical report text:\n" + extractedText + "\n\n"
                    + "In 3-5 sentences: summarize the key findings, flag any abnormal values, "
                    + "and suggest one next step for the patient. Use simple non-technical language.";

            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content",
                            "You are a friendly doctor summarizing lab results for a patient. Be concise."),
                    Map.of("role", "user", "content", prompt)
            );

            return callOpenAI(messages, 300);

        } catch (Exception e) {
            log.error("Error generating report explanation", e);
            return "Unable to generate explanation at this time.";
        }
    }

    /**
     * Generate SOAP note draft for doctors
     */
    public String generateSoapNote(String patientHistory, String symptoms) {
        try {
            String prompt = "Generate a SOAP note draft based on:\n\n"
                    + "Patient History: " + patientHistory + "\n"
                    + "Current Symptoms: " + symptoms + "\n\n"
                    + "Provide structured SOAP format:\n"
                    + "S (Subjective):\n"
                    + "O (Objective):\n"
                    + "A (Assessment):\n"
                    + "P (Plan):";

            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", "You are a medical professional creating clinical notes."),
                    Map.of("role", "user", "content", prompt)
            );

            return callOpenAI(messages);

        } catch (Exception e) {
            log.error("Error generating SOAP note", e);
            return "Unable to generate SOAP note.";
        }
    }

    /**
     * Build system prompt with health context — requests bilingual JSON output
     */
    private String buildSystemPrompt(String healthContext) {
        return "You are a knowledgeable medical AI assistant.\n\n"
                + "RULES:\n"
                + "- Provide helpful, empathetic health information in clear English (under 120 words).\n"
                + "- Then translate the SAME advice into simple Telugu.\n"
                + "- Stay strictly on medical/health topics only.\n"
                + "- Do NOT explain API keys, websites, sign-in steps, translation tools, or developer setup.\n"
                + "- Always remind users to consult a doctor for diagnosis.\n"
                + (healthContext != null && !healthContext.isEmpty()
                ? "- Patient context: " + healthContext + "\n" : "")
                + "\nReturn ONLY this exact JSON (no extra text, no code fences):\n"
                + "{\"english\":\"English advice here\",\"telugu\":\"Telugu translation here\"}";
    }

    private String sanitizeMedicalResponse(String userMessage, String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return buildSymptomFallback(userMessage);
        }

        String user = userMessage == null ? "" : userMessage.toLowerCase();
        String lower = aiResponse.toLowerCase();
        boolean clearlyOffTopic = lower.contains("openai")
                || lower.contains("api key")
                || lower.contains("click on")
                || lower.contains("sign in")
                || lower.contains("google account")
                || lower.contains("microsoft account")
                || lower.contains("translate")
                || lower.contains("website")
                || lower.contains("[humming]")
                || lower.contains("sri ")
                || lower.contains("ooya")
                || lower.contains("janei");

        boolean symptomQuery = user.contains("pain") || user.contains("fever") || user.contains("cough")
                || user.contains("cold") || user.contains("headache") || user.contains("vomit")
                || user.contains("nausea") || user.contains("stomach") || user.contains("throat");

        boolean hasMedicalSignals = lower.contains("doctor") || lower.contains("symptom")
                || lower.contains("medicine") || lower.contains("tablet") || lower.contains("rest")
                || lower.contains("hydration") || lower.contains("paracetamol")
                || lower.contains("consult") || lower.contains("fever") || lower.contains("pain")
                || lower.contains("infection") || lower.contains("hospital");

        if (clearlyOffTopic || (symptomQuery && !hasMedicalSignals)) {
            log.warn("Off-topic AI response filtered. user='{}' response='{}'", userMessage, aiResponse);
            return buildSymptomFallback(userMessage);
        }

        return aiResponse;
    }

    private String buildSymptomFallback(String userMessage) {
        String lower = userMessage == null ? "" : userMessage.toLowerCase();

        if (lower.contains("fever") || lower.contains("body pain") || lower.contains("body pains")
                || lower.contains("cough") || lower.contains("cold") || lower.contains("headache")) {
            return "{\"english\":\"For fever/body pain: rest well, drink plenty of fluids, and you may use paracetamol if suitable for you. Seek urgent care if fever stays high for more than 2-3 days, breathing becomes difficult, severe chest pain appears, or weakness worsens. Please consult a doctor for proper diagnosis.\",\"telugu\":\"జ్వరం/శరీర నొప్పి ఉంటే: బాగా విశ్రాంతి తీసుకోండి, ఎక్కువ ద్రవాలు తాగండి, మీకు సరిపోతే పారాసిటమాల్ తీసుకోవచ్చు. జ్వరం 2-3 రోజులకంటే ఎక్కువగా ఉంటే, శ్వాస ఇబ్బంది, తీవ్రమైన ఛాతి నొప్పి లేదా బలహీనత పెరిగితే వెంటనే డాక్టర్‌ను సంప్రదించండి.\"}";
        }

        return "{\"english\":\"I can help with health questions. Please share your symptoms, duration, and any fever/pain/cough details so I can guide you safely. Please consult a doctor for diagnosis.\",\"telugu\":\"నేను ఆరోగ్య సంబంధిత ప్రశ్నలకు సహాయం చేయగలను. దయచేసి మీ లక్షణాలు, అవి ఎన్ని రోజులు ఉన్నాయో, జ్వరం/నొప్పి/దగ్గు వివరాలు చెప్పండి. సరైన నిర్ధారణ కోసం డాక్టర్‌ను సంప్రదించండి.\"}";
    }

    /**
     * Call AI API — routes to Ollama (local) or OpenAI based on config
     */
    private String callOpenAI(List<Map<String, String>> messages) throws Exception {
        return callOpenAI(messages, 600);
    }

    private String callOpenAI(List<Map<String, String>> messages, int maxTokens) throws Exception {
        if (ollamaEnabled) {
            return callChatCompletions(
                    ollamaBaseUrl + "/v1/chat/completions",
                    ollamaModel,
                    messages,
                    maxTokens,
                    null
            );
        }

        return callChatCompletions(
                OPENAI_API_URL,
                openAiModel,
                messages,
                maxTokens,
                apiKey
        );
    }

    private String callChatCompletions(String apiUrl,
            String modelName,
            List<Map<String, String>> messages,
            int maxTokens,
            String bearerToken) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.setBearerAuth(bearerToken);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", modelName);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", maxTokens);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(apiUrl, HttpMethod.POST, request, String.class);
        } catch (HttpStatusCodeException e) {
            String body = e.getResponseBodyAsString();
            String message = "AI provider request failed with status " + e.getStatusCode().value();
            if (body != null && !body.isBlank()) {
                message += ": " + body;
            }
            throw new RuntimeException(message, e);
        }

        JsonNode jsonResponse = objectMapper.readTree(response.getBody());
        return jsonResponse.get("choices").get(0).get("message").get("content").asText();
    }

    /**
     * Parse AI response into structured format — handles bilingual JSON
     */
    private ChatResponse parseStructuredResponse(String aiResponse) {
        ChatResponse response = new ChatResponse();
        response.setIsEmergency(false);

        // Try to parse bilingual JSON {"english":"...","telugu":"..."}
        try {
            String cleaned = aiResponse.replaceAll("```[a-zA-Z]*\\n?", "").replace("```", "").trim();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
                JsonNode node = objectMapper.readTree(cleaned.substring(start, end + 1));
                if (node.has("english")) {
                    response.setResponse(node.get("english").asText());
                    response.setResponseTelugu(node.has("telugu") ? node.get("telugu").asText() : null);
                    ChatResponse.StructuredResponse structured = new ChatResponse.StructuredResponse();
                    structured.setDisclaimer("This information is for educational purposes only and is not a substitute for professional medical advice.");
                    response.setStructuredResponse(structured);
                    return response;
                }
            }
        } catch (Exception ignored) {
            /* fall through to plain-text handling */ }

        response.setResponse(aiResponse);

        // Plain-text section parsing fallback
        ChatResponse.StructuredResponse structured = new ChatResponse.StructuredResponse();
        if (aiResponse.contains("Symptom Summary") || aiResponse.contains("Possible Causes")) {
            String[] lines = aiResponse.split("\n");
            StringBuilder summary = new StringBuilder();
            StringBuilder causes = new StringBuilder();
            StringBuilder severity = new StringBuilder();
            StringBuilder action = new StringBuilder();
            String currentSection = "";
            for (String line : lines) {
                if (line.toLowerCase().contains("symptom")) {
                    currentSection = "summary";
                } else if (line.toLowerCase().contains("causes")) {
                    currentSection = "causes";
                } else if (line.toLowerCase().contains("severity")) {
                    currentSection = "severity";
                } else if (line.toLowerCase().contains("action") || line.toLowerCase().contains("recommend")) {
                    currentSection = "action";
                } else {
                    switch (currentSection) {
                        case "summary" ->
                            summary.append(line).append("\n");
                        case "causes" ->
                            causes.append(line).append("\n");
                        case "severity" ->
                            severity.append(line).append("\n");
                        case "action" ->
                            action.append(line).append("\n");
                    }
                }
            }
            structured.setSymptomSummary(summary.toString().trim());
            structured.setPossibleCauses(causes.toString().trim());
            structured.setSeverityLevel(severity.toString().trim());
            structured.setRecommendedAction(action.toString().trim());
        }
        structured.setDisclaimer("This information is for educational purposes only and is not a substitute for professional medical advice.");
        response.setStructuredResponse(structured);
        return response;
    }

    /**
     * Create error response
     */
    private ChatResponse createErrorResponse(String errorMessage) {
        ChatResponse response = new ChatResponse();
        if (errorMessage != null && errorMessage.contains("status 429")) {
            response.setResponse("OpenAI quota/rate limit reached. Please verify billing and usage limits for your API key, then try again.");
        } else if (errorMessage != null && errorMessage.contains("status 404")) {
            response.setResponse("The configured OpenAI model was not found for this API key. Please use a supported model like gpt-4o-mini.");
        } else {
            response.setResponse("I apologize, but I'm unable to process your request at the moment. Please try again later.");
        }
        response.setIsEmergency(false);
        return response;
    }
}
