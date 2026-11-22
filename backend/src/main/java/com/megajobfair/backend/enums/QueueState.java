package com.megajobfair.backend.enums;

/** State of one visit to a company's queue. */
public enum QueueState {
    ACTIVE,   // in the queue now (waiting or in interview)
    DROPPED,  // student left the queue themselves
    DONE      // HR gave a decision (selected / rejected)
}