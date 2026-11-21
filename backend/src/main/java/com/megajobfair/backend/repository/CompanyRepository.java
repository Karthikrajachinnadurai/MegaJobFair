package com.megajobfair.backend.repository;

import com.megajobfair.backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<Company> findAllByOrderByNameAsc();

    List<Company> findByActiveTrueOrderByNameAsc();
}
