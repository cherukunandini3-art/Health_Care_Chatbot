package com.healthcare.service;

import com.healthcare.dto.ChatRequest;
import com.healthcare.dto.ChatResponse;
import com.healthcare.model.*;
import com.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing chat sessions and messages
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {
    
    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final OpenAIService openAIService;
    
    /**
     * Create a new chat session
     */
    @Transactional
    public ChatSession createChatSession(User user, String title) {
        ChatSession session = new ChatSession();
        session.setUser(user);
        session.setTitle(title != null ? title : "New Conversation");
        session.setIsActive(true);
        session.setIsEmergency(false);
        session.setLastMessageAt(LocalDateTime.now());
        
        return chatSessionRepository.save(session);
    }
    
    /**
     * Process chat message and generate AI response
     */
    @Transactional
    public ChatResponse processMessage(ChatRequest chatRequest, User user) {
        try {
            // Get or create chat session
            ChatSession session;
            if (chatRequest.getSessionId() != null) {
                session = chatSessionRepository.findById(chatRequest.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Chat session not found"));
            } else {
                // Create new session with first few words as title
                String title = generateTitle(chatRequest.getMessage());
                session = createChatSession(user, title);
            }
            
            // Save user message
            Message userMessage = new Message();
            userMessage.setChatSession(session);
            userMessage.setRole(Message.MessageRole.USER);
            userMessage.setContent(chatRequest.getMessage());
            messageRepository.save(userMessage);
            
            // Check for emergency keywords
            if (openAIService.isEmergency(chatRequest.getMessage())) {
                session.setIsEmergency(true);
                chatSessionRepository.save(session);
                
                ChatResponse emergencyResponse = openAIService.generateEmergencyResponse();
                
                // Save emergency response
                Message assistantMessage = saveAssistantMessage(session, emergencyResponse);
                
                emergencyResponse.setMessageId(assistantMessage.getId());
                emergencyResponse.setSessionId(session.getId());
                emergencyResponse.setTimestamp(LocalDateTime.now());
                
                return emergencyResponse;
            }
            
            // Get conversation history
            List<Message> conversationHistory = messageRepository.findByChatSessionOrderByCreatedAtAsc(session);
            
            // Get user health context
            String healthContext = buildHealthContext(user);
            
            // Generate AI response
            ChatResponse aiResponse = openAIService.generateChatResponse(
                chatRequest.getMessage(),
                conversationHistory,
                healthContext
            );
            
            // Save assistant message
            Message assistantMessage = saveAssistantMessage(session, aiResponse);
            
            // Update session
            session.setLastMessageAt(LocalDateTime.now());
            chatSessionRepository.save(session);
            
            // Set response metadata
            aiResponse.setMessageId(assistantMessage.getId());
            aiResponse.setSessionId(session.getId());
            aiResponse.setTimestamp(LocalDateTime.now());
            
            return aiResponse;
            
        } catch (Exception e) {
            log.error("Error processing chat message", e);
            throw new RuntimeException("Failed to process message: " + e.getMessage());
        }
    }
    
    /**
     * Get all chat sessions for a user
     */
    public List<ChatSession> getUserChatSessions(User user) {
        return chatSessionRepository.findByUserAndIsActiveOrderByLastMessageAtDesc(user, true);
    }
    
    /**
     * Get messages for a chat session
     */
    public List<Message> getSessionMessages(Long sessionId, User user) {
        ChatSession session = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));
        
        // Verify session belongs to user
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to chat session");
        }
        
        return messageRepository.findByChatSessionOrderByCreatedAtAsc(session);
    }
    
    /**
     * Delete chat session
     */
    @Transactional
    public void deleteChatSession(Long sessionId, User user) {
        ChatSession session = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));
        
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to chat session");
        }
        
        session.setIsActive(false);
        chatSessionRepository.save(session);
    }
    
    /**
     * Regenerate last AI response
     */
    @Transactional
    public ChatResponse regenerateResponse(Long sessionId, User user) {
        ChatSession session = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));
        
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to chat session");
        }
        
        List<Message> messages = messageRepository.findByChatSessionOrderByCreatedAtAsc(session);
        
        if (messages.isEmpty()) {
            throw new RuntimeException("No messages to regenerate");
        }
        
        // Get the last user message
        Message lastUserMessage = null;
        for (int i = messages.size() - 1; i >= 0; i--) {
            if (messages.get(i).getRole() == Message.MessageRole.USER) {
                lastUserMessage = messages.get(i);
                break;
            }
        }
        
        if (lastUserMessage == null) {
            throw new RuntimeException("No user message found");
        }
        
        // Remove last assistant message if exists
        if (!messages.isEmpty() && messages.get(messages.size() - 1).getRole() == Message.MessageRole.ASSISTANT) {
            messageRepository.delete(messages.get(messages.size() - 1));
            messages.remove(messages.size() - 1);
        }
        
        // Get health context
        String healthContext = buildHealthContext(user);
        
        // Generate new response
        ChatResponse aiResponse = openAIService.generateChatResponse(
            lastUserMessage.getContent(),
            messages,
            healthContext
        );
        
        // Save new assistant message
        Message newAssistantMessage = saveAssistantMessage(session, aiResponse);
        
        aiResponse.setMessageId(newAssistantMessage.getId());
        aiResponse.setSessionId(session.getId());
        aiResponse.setTimestamp(LocalDateTime.now());
        
        return aiResponse;
    }
    
    /**
     * Build health context from user profile
     */
    private String buildHealthContext(User user) {
        return healthProfileRepository.findByUser(user)
            .map(profile -> String.format(
                "Age: %s, Allergies: %s, Chronic Conditions: %s, Current Medications: %s",
                profile.getAge() != null ? profile.getAge() : "N/A",
                profile.getAllergies() != null && !profile.getAllergies().isEmpty() ? profile.getAllergies() : "None",
                profile.getChronicConditions() != null && !profile.getChronicConditions().isEmpty() ? profile.getChronicConditions() : "None",
                profile.getCurrentMedications() != null && !profile.getCurrentMedications().isEmpty() ? profile.getCurrentMedications() : "None"
            ))
            .orElse("");
    }
    
    /**
     * Save assistant message
     */
    private Message saveAssistantMessage(ChatSession session, ChatResponse response) {
        Message message = new Message();
        message.setChatSession(session);
        message.setRole(Message.MessageRole.ASSISTANT);
        message.setContent(response.getResponse());
        // In production, serialize structuredResponse to JSON
        return messageRepository.save(message);
    }
    
    /**
     * Generate title from message
     */
    private String generateTitle(String message) {
        String[] words = message.split("\\s+");
        int wordCount = Math.min(words.length, 5);
        StringBuilder title = new StringBuilder();
        for (int i = 0; i < wordCount; i++) {
            title.append(words[i]).append(" ");
        }
        return title.toString().trim() + (words.length > 5 ? "..." : "");
    }
}
