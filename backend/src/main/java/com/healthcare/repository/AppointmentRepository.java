package com.healthcare.repository;

import com.healthcare.model.Appointment;
import com.healthcare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Appointment entity operations
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByPatientOrderByAppointmentDateDesc(User patient);
    
    List<Appointment> findByDoctorOrderByAppointmentDateDesc(User doctor);
    
    @Query("SELECT COUNT(a) FROM Appointment a")
    Long countAllAppointments();
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = 'PENDING'")
    Long countPendingAppointments();
}
