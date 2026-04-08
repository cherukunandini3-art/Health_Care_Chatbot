package com.healthcare.repository;

import com.healthcare.model.ChatSession;
import com.healthcare.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Message entity operations
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    List<Message> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);
    
    @Query("SELECT COUNT(m) FROM Message m")
    Long countAllMessages();
    
    @Query("SELECT m.content FROM Message m WHERE m.role = 'USER' ORDER BY m.createdAt DESC")
    List<String> findRecentUserMessages();
}
