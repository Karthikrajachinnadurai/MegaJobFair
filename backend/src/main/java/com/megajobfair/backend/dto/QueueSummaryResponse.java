package com.megajobfair.backend.dto;

import java.util.List;

/** Live view of one company's queue, polled by the company screen every few seconds. */
public record QueueSummaryResponse(
        Long companyId,
        String companyName,
        long registered,
        long waiting,
        long inInterview,
        long selected,
        long rejected,
        List<QueueItem> waitingList,
        List<QueueItem> inInterviewList
) {
}