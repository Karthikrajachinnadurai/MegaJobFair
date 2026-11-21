package com.megajobfair.backend.repository;

import com.megajobfair.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByQrToken(String qrToken);

    Optional<Student> findByUser_Id(Long userId);

    boolean existsByEmailIgnoreCase(String email);

    List<Student> findAllByOrderByNameAsc();
}
