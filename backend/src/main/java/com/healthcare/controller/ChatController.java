package com.healthcare.controller;

import com.healthcare.dto.ApiResponse;
import com.healthcare.dto.ChatRequest;
import com.healthcare.dto.ChatResponse;
import com.healthcare.dto.LocationChatRequest;
import com.healthcare.dto.LocationChatResponse;
import com.healthcare.model.ChatSession;
import com.healthcare.model.Message;
import com.healthcare.model.User;
import com.healthcare.service.AuthService;
import com.healthcare.service.ChatService;
import com.healthcare.service.LocationChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for chat operations
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;
    private final LocationChatService locationChatService;

    /**
     * Send a chat message
     */
    @PostMapping("/message")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody ChatRequest chatRequest) {
        try {
            User currentUser = authService.getCurrentUser();
            ChatResponse response = chatService.processMessage(chatRequest, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Location-aware chat: returns AI suggestion + nearby doctors + hospitals
     */
    @PostMapping("/location")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN')")
    public ResponseEntity<?> locationChat(@RequestBody LocationChatRequest request) {
        try {
            LocationChatResponse response = locationChatService.process(
                    request.getMessage(),
                    request.getLatitude(),
                    request.getLongitude()
            );
            return ResponseEntity.ok(new ApiResponse(true, "OK", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all chat sessions for current user
     */
    @GetMapping("/sessions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getChatSessions() {
        try {
            User currentUser = authService.getCurrentUser();
            List<ChatSession> sessions = chatService.getUserChatSessions(currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Chat sessions retrieved", sessions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get messages for a specific session
     */
    @GetMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getSessionMessages(@PathVariable Long sessionId) {
        try {
            User currentUser = authService.getCurrentUser();
            List<Message> messages = chatService.getSessionMessages(sessionId, currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Messages retrieved", messages));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Create a new chat session
     */
    @PostMapping("/sessions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> createChatSession(@RequestParam(required = false) String title) {
        try {
            User currentUser = authService.getCurrentUser();
            ChatSession session = chatService.createChatSession(currentUser, title);
            return ResponseEntity.ok(new ApiResponse(true, "Session created", session));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Delete a chat session
     */
    @DeleteMapping("/sessions/{sessionId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> deleteChatSession(@PathVariable Long sessionId) {
        try {
            User currentUser = authService.getCurrentUser();
            chatService.deleteChatSession(sessionId, currentUser);
            return ResponseEntity.ok(new ApiResponse(true, "Session deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Regenerate last response
     */
    @PostMapping("/sessions/{sessionId}/regenerate")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> regenerateResponse(@PathVariable Long sessionId) {
        try {
            User currentUser = authService.getCurrentUser();
            ChatResponse response = chatService.regenerateResponse(sessionId, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}
