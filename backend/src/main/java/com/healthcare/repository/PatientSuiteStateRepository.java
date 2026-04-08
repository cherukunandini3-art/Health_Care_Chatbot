package com.healthcare.repository;

import com.healthcare.model.PatientSuiteState;
import com.healthcare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientSuiteStateRepository extends JpaRepository<PatientSuiteState, Long> {

    Optional<PatientSuiteState> findByUser(User user);
}
