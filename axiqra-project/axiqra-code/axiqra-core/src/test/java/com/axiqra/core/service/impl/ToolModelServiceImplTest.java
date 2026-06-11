package com.axiqra.core.service.impl;

import com.axiqra.common.domain.entity.ToolModelAttributionEntity;
import com.axiqra.common.domain.entity.ToolModelLeaderboardSnapshotEntity;
import com.axiqra.common.domain.vo.ToolModelLeaderboardVO;
import com.axiqra.core.mapper.ToolModelAttributionMapper;
import com.axiqra.core.mapper.ToolModelLeaderboardMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ToolModelServiceImpl 单元测试")
class ToolModelServiceImplTest {

    @Mock
    private ToolModelLeaderboardMapper leaderboardMapper;

    @Mock
    private ToolModelAttributionMapper attributionMapper;

    @InjectMocks
    private ToolModelServiceImpl toolModelService;

    @Test
    @DisplayName("getLeaderboard 无 toolName 应返回排行榜")
    void shouldReturnLeaderboard() {
        ToolModelLeaderboardSnapshotEntity entity = leaderboardEntity("cursor", "gpt-4o",
                new BigDecimal("95.5"), new BigDecimal("95.0"), 1000, 1);
        when(leaderboardMapper.selectLeaderboard(LocalDate.now(), "public", null, 50))
                .thenReturn(List.of(entity));

        List<ToolModelLeaderboardVO> result = toolModelService.getLeaderboard("public", null, null, 50);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("cursor", result.get(0).getToolName());
        assertEquals("gpt-4o", result.get(0).getReportedModelName());
        assertEquals(new BigDecimal("95.5"), result.get(0).getSuccessRate7d());
    }

    @Test
    @DisplayName("getLeaderboard 带 toolName 应传入 limit 参数")
    void shouldPassLimitWhenToolNameProvided() {
        ToolModelLeaderboardSnapshotEntity entity = leaderboardEntity("cursor", "gpt-4o",
                new BigDecimal("95.5"), new BigDecimal("95.0"), 1000, 1);
        when(leaderboardMapper.selectByToolName(LocalDate.now(), "public", null, "cursor", 50))
                .thenReturn(List.of(entity));

        List<ToolModelLeaderboardVO> result =
                toolModelService.getLeaderboard("public", null, "cursor", 50);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("cursor", result.get(0).getToolName());
    }

    @Test
    @DisplayName("backfillAttribution 已存在时应跳过")
    void shouldSkipWhenAttributionExists() {
        ToolModelAttributionEntity existing = new ToolModelAttributionEntity();
        existing.setRequestId("req-1");
        when(attributionMapper.selectByRequestId("req-1")).thenReturn(existing);

        toolModelService.backfillAttribution(77L, "req-1", "cursor", "openai", "gpt-4o", "v1", "0.9");

        verify(attributionMapper, never()).insert(any());
    }

    @Test
    @DisplayName("backfillAttribution 不存在时应创建记录")
    void shouldCreateAttributionOnBackfill() {
        when(attributionMapper.selectByRequestId("req-new")).thenReturn(null);
        ArgumentCaptor<ToolModelAttributionEntity> captor =
                ArgumentCaptor.forClass(ToolModelAttributionEntity.class);

        toolModelService.backfillAttribution(77L, "req-new", "cursor", "openai", "gpt-4o", "v1", "0.9");

        verify(attributionMapper).insert(captor.capture());
        assertEquals(77L, captor.getValue().getSolutionId());
        assertEquals("req-new", captor.getValue().getRequestId());
        assertEquals("cursor", captor.getValue().getToolName());
        assertEquals("openai", captor.getValue().getReportedModelProvider());
        assertEquals("gpt-4o", captor.getValue().getReportedModelName());
        assertEquals("v1", captor.getValue().getReportedModelVersion());
        assertEquals("0.9", captor.getValue().getReportedModelConfidence());
        assertEquals("backfill", captor.getValue().getAttributionSource());
    }

    @Test
    @DisplayName("getLeaderboard 空结果应返回空列表")
    void shouldReturnEmptyLeaderboard() {
        when(leaderboardMapper.selectLeaderboard(LocalDate.now(), "public", null, 50))
                .thenReturn(List.of());

        List<ToolModelLeaderboardVO> result =
                toolModelService.getLeaderboard("public", null, null, 50);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getLeaderboard null 输入应返回空列表而非抛异常")
    void shouldReturnEmptyListForNullInput() {
        List<ToolModelLeaderboardVO> result = toolModelService.getLeaderboard("public", null, null, 50);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    private ToolModelLeaderboardSnapshotEntity leaderboardEntity(
            String toolName, String modelName, BigDecimal successRate,
            BigDecimal rankScore, Integer sampleSize, Integer rank) {
        ToolModelLeaderboardSnapshotEntity entity = new ToolModelLeaderboardSnapshotEntity();
        entity.setToolName(toolName);
        entity.setReportedModelName(modelName);
        entity.setSuccessRate7d(successRate);
        entity.setSampleSize(sampleSize);
        entity.setRank(rank);
        entity.setRankScore(rankScore);
        entity.setDomain("coding");
        entity.setTechStack("java");
        entity.setWindowStart(LocalDate.now().minusDays(7));
        entity.setWindowEnd(LocalDate.now());
        return entity;
    }
}
