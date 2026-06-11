package com.axiqra.api.controller;

import com.axiqra.common.domain.dto.FeedbackSubmitRequest;
import com.axiqra.common.domain.vo.FeedbackDetailVO;
import com.axiqra.common.domain.vo.SolutionFeedbackStatsVO;
import com.axiqra.core.service.FeedbackService;
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
@DisplayName("FeedbackController 接口测试")
class FeedbackControllerTest {

    @Mock
    private FeedbackService feedbackService;

    @InjectMocks
    private FeedbackController controller;

    @Test
    @DisplayName("POST /api/v1/feedbacks 应调用 service.submitFeedback")
    void submitFeedbackShouldDelegate() {
        FeedbackSubmitRequest request = new FeedbackSubmitRequest();
        request.setInvocationId(77L);
        request.setFeedbackType("worked");
        request.setFeedbackContent("很好用");

        FeedbackDetailVO expected = new FeedbackDetailVO();
        expected.setId(5L);
        expected.setInvocationId(77L);
        expected.setUserId(1L);
        expected.setFeedbackType("worked");
        expected.setFeedbackTypeDesc("方案有效");
        expected.setStatus("accepted");

        when(feedbackService.submitFeedback(1L, request)).thenReturn(expected);

        var result = controller.submitFeedback(1L, request);

        assertNotNull(result);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(5L, result.getBody().getId());
        verify(feedbackService).submitFeedback(1L, request);
    }

    @Test
    @DisplayName("GET /api/v1/feedbacks 应调用 service.listFeedbacks")
    void listFeedbacksShouldDelegate() {
        FeedbackDetailVO vo = new FeedbackDetailVO();
        vo.setId(5L);
        vo.setFeedbackType("worked");
        vo.setFeedbackTypeDesc("方案有效");

        when(feedbackService.listFeedbacks(1L, "solution", 77L))
                .thenReturn(List.of(vo));

        var result = controller.listFeedbacks(1L, "solution", 77L);

        assertNotNull(result);
        assertEquals(1, result.getBody().size());
        verify(feedbackService).listFeedbacks(1L, "solution", 77L);
    }

    @Test
    @DisplayName("GET /api/v1/feedbacks/solutions/{id}/stats 应返回统计")
    void getStatsShouldReturnStats() {
        SolutionFeedbackStatsVO expected = new SolutionFeedbackStatsVO();
        expected.setWorkedCount(10L);
        expected.setTotalCount(15L);

        when(feedbackService.getSolutionFeedbackStats(77L)).thenReturn(expected);

        var result = controller.getSolutionFeedbackStats(77L);

        assertNotNull(result);
        assertEquals(10L, result.getBody().getWorkedCount());
        verify(feedbackService).getSolutionFeedbackStats(77L);
    }
}
