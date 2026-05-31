<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps<{ bitfield?: string; numPieces?: string }>();
const canvas = ref<HTMLCanvasElement | null>(null);

function draw(): void {
  const el = canvas.value;
  if (!el || !props.bitfield || !props.numPieces) return;

  const num = Number(props.numPieces);
  if (!num) return;

  const ctx = el.getContext("2d");
  if (!ctx) return;

  const hex = props.bitfield;
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

  const width = el.width;
  const height = el.height;
  ctx.clearRect(0, 0, width, height);

  const pieceWidth = width / num;
  let bitIndex = 0;

  for (const byte of bytes) {
    for (let b = 7; b >= 0 && bitIndex < num; b--) {
      const has = (byte >> b) & 1;
      ctx.fillStyle = has ? "#62c462" : "#e0e0e0";
      ctx.fillRect(bitIndex * pieceWidth, 0, Math.max(pieceWidth, 1), height);
      bitIndex++;
    }
  }
}

onMounted(draw);
watch(() => [props.bitfield, props.numPieces], draw);
</script>

<template>
  <canvas ref="canvas" width="300" height="12" class="w-full rounded" />
</template>
