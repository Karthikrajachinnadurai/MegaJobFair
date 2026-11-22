package com.megajobfair.backend.entity;

import com.megajobfair.backend.enums.QueueState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/** One visit of a student to one company's waiting list. */
@Entity
@Table(name = "queue_entries")
public class QueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QueueState state = QueueState.ACTIVE;

    /** The company volunteer who scanned the student in. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanned_by")
    private User scannedBy;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }

    /** Close this visit: used by drop (DROPPED) and by the HR decision (DONE). */
    public void close(QueueState finalState) {
        this.state = finalState;
        this.leftAt = Instant.now();
    }

    public Long getId() { return id; }

    public Registration getRegistration() { return registration; }
    public void setRegistration(Registration registration) { this.registration = registration; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public QueueState getState() { return state; }

    public User getScannedBy() { return scannedBy; }
    public void setScannedBy(User scannedBy) { this.scannedBy = scannedBy; }

    public Instant getJoinedAt() { return joinedAt; }

    public Instant getLeftAt() { return leftAt; }
}