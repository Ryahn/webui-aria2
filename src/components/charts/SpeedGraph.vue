<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { SpeedSample } from "../../api/aria2-types";

const props = defineProps<{ samples: SpeedSample[] }>();
const chartEl = ref<HTMLElement | null>(null);
let chart: uPlot | null = null;

function buildChart(): void {
  if (!chartEl.value) return;

  const isDark = document.documentElement.dataset.theme === "dark";
  const gridColor = isDark ? "#333" : "#e0e0e0";
  const textColor = isDark ? "#e8e8e8" : "#1a1a1a";

  const data: uPlot.AlignedData = [
    props.samples.map((s) => s.time / 1000),
    props.samples.map((s) => s.download),
    props.samples.map((s) => s.upload),
  ];

  if (chart) {
    chart.setData(data);
    return;
  }

  chart = new uPlot(
    {
      width: chartEl.value.clientWidth,
      height: 120,
      series: [
        {},
        { label: "Download", stroke: "#1a736b", width: 2 },
        { label: "Upload", stroke: "#428bca", width: 2 },
      ],
      axes: [
        { show: false },
        {
          stroke: textColor,
          grid: { show: true, stroke: gridColor },
          values: (_u, vals) => vals.map((v) => `${(Number(v) / 1024 / 1024).toFixed(1)} MB/s`),
        },
      ],
      legend: { show: true },
    },
    data,
    chartEl.value
  );
}

watch(() => props.samples.length, buildChart, { deep: true });

onMounted(() => {
  buildChart();
  const ro = new ResizeObserver(() => {
    if (chart && chartEl.value) chart.setSize({ width: chartEl.value.clientWidth, height: 120 });
  });
  if (chartEl.value) ro.observe(chartEl.value);
  onUnmounted(() => {
    ro.disconnect();
    chart?.destroy();
  });
});
</script>

<template>
  <div ref="chartEl" class="w-full" />
</template>

<style scoped>
:deep(.u-legend) {
  font-size: 12px;
}
</style>
