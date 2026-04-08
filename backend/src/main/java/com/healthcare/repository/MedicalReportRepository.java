package com.healthcare.repository;

import com.healthcare.model.MedicalReport;
import com.healthcare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for MedicalReport entity operations
 */
@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    
    List<MedicalReport> findByUserOrderByUploadedAtDesc(User user);
}
