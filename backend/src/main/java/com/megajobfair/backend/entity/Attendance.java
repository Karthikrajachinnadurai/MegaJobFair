package com.megajobfair.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/** Gate check-in. At most one row per student. */
@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, unique = true)
    private Student student;

    /** The gate volunteer who scanned the QR. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanned_by")
    private User scannedBy;

    @Column(name = "checked_in_at", nullable = false, updatable = false)
    private Instant checkedInAt;

    @PrePersist
    void onCreate() {
        if (checkedInAt == null) {
            checkedInAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public User getScannedBy() { return scannedBy; }
    public void setScannedBy(User scannedBy) { this.scannedBy = scannedBy; }

    public Instant getCheckedInAt() { return checkedInAt; }
}
