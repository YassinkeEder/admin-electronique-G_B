import { prisma } from '../prisma';
/**
 * Get metrics with optional filtering
 */
export async function getMetrics(filters) {
    try {
        const where = {};
        if (filters?.projectId)
            where.projectId = filters.projectId;
        if (filters?.kpiType)
            where.kpiType = filters.kpiType;
        if (filters?.fromDate || filters?.toDate) {
            where.recordedAt = {};
            if (filters.fromDate)
                where.recordedAt.gte = filters.fromDate;
            if (filters.toDate)
                where.recordedAt.lte = filters.toDate;
        }
        return await prisma.metric.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
            },
            orderBy: { recordedAt: "desc" },
        });
    }
    catch (error) {
        console.error("[getMetrics]", error);
        throw new Error("Failed to fetch metrics");
    }
}
/**
 * Get metrics for a specific project
 */
export async function getProjectMetrics(projectId) {
    try {
        return await prisma.metric.findMany({
            where: { projectId },
            orderBy: { recordedAt: "desc" },
        });
    }
    catch (error) {
        console.error("[getProjectMetrics]", error);
        throw new Error("Failed to fetch project metrics");
    }
}
/**
 * Get latest metrics by KPI type
 */
export async function getLatestMetricsByType(projectId, kpiType) {
    try {
        return await prisma.metric.findFirst({
            where: {
                projectId,
                kpiType,
            },
            orderBy: { recordedAt: "desc" },
        });
    }
    catch (error) {
        console.error("[getLatestMetricsByType]", error);
        throw new Error("Failed to fetch metric");
    }
}
/**
 * Create metric
 */
export async function createMetric(data) {
    try {
        return await prisma.metric.create({
            data: {
                ...data,
                recordedAt: data.recordedAt || new Date(),
            },
            include: { project: true },
        });
    }
    catch (error) {
        console.error("[createMetric]", error);
        throw new Error("Failed to create metric");
    }
}
/**
 * Update metric
 */
export async function updateMetric(id, data) {
    try {
        return await prisma.metric.update({
            where: { id },
            data,
        });
    }
    catch (error) {
        console.error("[updateMetric]", error);
        throw new Error("Failed to update metric");
    }
}
/**
 * Bulk create metrics (useful for batch operations)
 */
export async function bulkCreateMetrics(data) {
    try {
        const results = await Promise.all(data.map((item) => prisma.metric.create({
            data: {
                ...item,
                recordedAt: item.recordedAt || new Date(),
            },
        })));
        return results;
    }
    catch (error) {
        console.error("[bulkCreateMetrics]", error);
        throw new Error("Failed to create metrics");
    }
}
/**
 * Get KPI summary for a project
 */
export async function getProjectKpiSummary(projectId) {
    try {
        const kpiTypes = [
            "budget_variance",
            "roi",
            "delay_index",
            "completion_rate",
            "cost_per_beneficiary",
            "efficiency_score",
        ];
        const summary = {};
        for (const kpiType of kpiTypes) {
            const latest = await prisma.metric.findFirst({
                where: {
                    projectId,
                    kpiType,
                },
                orderBy: { recordedAt: "desc" },
            });
            if (latest) {
                summary[kpiType] = {
                    value: latest.value,
                    target: latest.targetValue,
                    unit: latest.unit,
                    period: latest.periodLabel,
                    performance: latest.targetValue > 0
                        ? Math.round((latest.value / latest.targetValue) * 100)
                        : 0,
                };
            }
        }
        return summary;
    }
    catch (error) {
        console.error("[getProjectKpiSummary]", error);
        throw new Error("Failed to fetch KPI summary");
    }
}
