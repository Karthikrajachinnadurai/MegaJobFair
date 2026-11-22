package com.megajobfair.backend.repository;

import com.megajobfair.backend.entity.QueueEntry;
import com.megajobfair.backend.enums.QueueState;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    /** Conflict check: is this student active in ANY queue? (at most one, thanks to the unique index) */
    Optional<QueueEntry> findByStudent_IdAndState(Long studentId, QueueState state);

    /** Drop: the student's active entry at one specific company. */
    Optional<QueueEntry> findByStudent_IdAndCompany_IdAndState(Long studentId, Long companyId, QueueState state);

    /** HR actions: the active entry belonging to a registration. */
    Optional<QueueEntry> findByRegistration_IdAndState(Long registrationId, QueueState state);

    /** Company screen: the live list, oldest first. Loads student and registration in the same query. */
    @EntityGraph(attributePaths = {"student", "registration"})
    List<QueueEntry> findByCompany_IdAndStateOrderByJoinedAtAsc(Long companyId, QueueState state);

    /** HR search: active entries of one company whose student name contains the text (any case). */
    @EntityGraph(attributePaths = {"student", "registration"})
    List<QueueEntry> findByCompany_IdAndStateAndStudent_NameContainingIgnoreCaseOrderByJoinedAtAsc(
            Long companyId, QueueState state, String name);
}