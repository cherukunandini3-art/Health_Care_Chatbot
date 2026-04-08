package com.healthcare.repository;

import com.healthcare.model.ChatSession;
import com.healthcare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ChatSession entity operations
 */
@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserOrderByCreatedAtDesc(User user);

    List<ChatSession> findByUserAndIsActiveOrderByLastMessageAtDesc(User user, Boolean isActive);

    Long countByUser(User user);

    @Query("SELECT COUNT(c) FROM ChatSession c WHERE c.isEmergency = true")
    Long countEmergencySessions();

    @Query("SELECT c FROM ChatSession c ORDER BY c.lastMessageAt DESC")
    List<ChatSession> findAllOrderByLastMessageAtDesc();
}
