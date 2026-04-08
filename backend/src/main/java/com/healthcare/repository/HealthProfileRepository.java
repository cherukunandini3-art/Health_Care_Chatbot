package com.healthcare.repository;

import com.healthcare.model.HealthProfile;
import com.healthcare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for HealthProfile entity operations
 */
@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Long> {
    
    Optional<HealthProfile> findByUser(User user);
}
