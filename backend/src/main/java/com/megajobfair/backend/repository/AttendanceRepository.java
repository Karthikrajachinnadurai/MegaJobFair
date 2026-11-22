package com.megajobfair.backend.repository;

import com.megajobfair.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByStudent_Id(Long studentId);

    boolean existsByStudent_Id(Long studentId);

    List<Attendance> findByStudent_IdIn(List<Long> studentIds);
}
