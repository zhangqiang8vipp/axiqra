package com.axiqra.api.controller;

import com.axiqra.common.domain.vo.ContributionSummaryVO;
import com.axiqra.core.service.ContributionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContributionController 接口测试")
class ContributionControllerTest {

    @Mock
    private ContributionService contributionService;

    @InjectMocks
    private ContributionController controller;

    @Test
    @DisplayName("GET /api/v1/contributions/users/{id}/summary 应返回汇总")
    void getSummaryShouldReturn() {
        ContributionSummaryVO expected = new ContributionSummaryVO();
        expected.setActorId(1L);
        expected.setTotalPoints(120);
        expected.setTraceCount(5);
        expected.setSolutionCount(3);
        expected.setCaseCount(2);

        when(contributionService.getContributionSummary(1L)).thenReturn(expected);

        var result = controller.getContributionSummary(1L);

        assertNotNull(result);
        assertEquals(120, result.getBody().getTotalPoints());
        assertEquals(5, result.getBody().getTraceCount());
        verify(contributionService).getContributionSummary(1L);
    }

    @Test
    @DisplayName("GET /api/v1/contributions/users/{id}/records 应返回记录列表")
    void getRecordsShouldReturnList() {
        ContributionSummaryVO.ContributionRecord record = new ContributionSummaryVO.ContributionRecord();
        record.setId(1L);
        record.setEventType("trace_created");
        record.setPoints(10);

        when(contributionService.getContributionRecords(1L, 20)).thenReturn(List.of(record));

        var result = controller.getContributionRecords(1L, 20);

        assertNotNull(result);
        assertEquals(1, result.getBody().size());
        assertEquals("trace_created", result.getBody().get(0).getEventType());
        verify(contributionService).getContributionRecords(1L, 20);
    }
}
