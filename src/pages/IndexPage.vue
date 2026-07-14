<template>
  <q-page class="dashboard-page">
    <!-- ═══ Hero Header ═══ -->
    <div class="hero-header">
      <div class="hero-decor hero-decor--1"></div>
      <div class="hero-decor hero-decor--2"></div>
      <div class="hero-decor hero-decor--3"></div>
      <div class="hero-inner">
        <div class="hero-text">
          <div class="hero-eyebrow">
            <span class="hero-dot"></span>ระบบคลังเวชภัณฑ์
          </div>
          <div class="hero-title">Dashboard</div>
          <div class="hero-subtitle">
            ภาพรวมคลังพัสดุ · ปีงบประมาณ พ.ศ. {{ buddhistFiscalYear }}
          </div>
        </div>
      </div>

      <div class="card-row">
        <div
          v-for="(card, ci) in summaryCards"
          :key="card.key"
          class="stat-card"
          :class="{ 'stat-card--counting': card.animating }"
          :style="{ '--delay': ci * 0.12 + 's' }"
        >
          <div class="stat-card__shine"></div>
          <div
            class="stat-card__icon"
            :style="{ background: card.iconBg }"
            :class="{ 'stat-card__icon--pulse': card.animating }"
          >
            <q-icon
              :name="card.icon"
              size="24px"
              :style="{ color: card.color }"
            />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ card.label }}</span>
            <div class="stat-card__row">
              <span
                class="stat-card__value"
                :class="{ 'stat-card__value--counting': card.animating }"
                :style="{ color: card.color }"
              >
                <template v-if="loading">—</template>
                <template v-else>{{ card.display }}</template>
              </span>
              <span class="stat-card__unit">{{ card.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Content ═══ -->
    <div class="content-area">
      <!-- Filter -->
      <div class="filter-bar">
        <div class="filter-bar__label">
          <q-icon name="tune" size="18px" color="grey-7" />
          <span>ตัวกรอง</span>
        </div>
        <div class="filter-bar__fields">
          <q-select
            v-model="fiscalYear"
            :options="filteredFiscalYearOptions"
            label="ปีงบประมาณ"
            outlined
            dense
            emit-value
            map-options
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            class="filter-field fiscal-field"
            popup-content-class="filter-popup"
            @filter="filterFiscalYear"
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey"
                  >ไม่พบปีงบประมาณ</q-item-section
                >
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="selectedMonth"
            :options="MONTH_OPTIONS"
            label="เดือน"
            outlined
            dense
            emit-value
            map-options
            clearable
            class="filter-field month-field"
            popup-content-class="filter-popup"
          />

        </div>
      </div>

      <!-- ═══ Monthly Line Chart + Pie ═══ -->
      <div class="panel">
        <div class="panel__head">
          <div>
            <div class="panel__title">
              <q-icon
                name="bar_chart"
                size="20px"
                color="deep-orange-4"
                class="q-mr-xs"
              />
              อัตราสำรองเวชภัณฑ์รายเดือน
            </div>
            <div class="panel__sub">
              ปีงบประมาณ พ.ศ. {{ buddhistFiscalYear }}
            </div>
          </div>
          <div class="legend-inline">
  <span class="legend-inline__dot" style="background: #EF4444"></span>
  <span class="legend-inline__text">≥ 60 บาท</span>
  <span class="legend-inline__dot" style="background: #FACC15; margin-left: 12px"></span>
  <span class="legend-inline__text">&lt; 60 บาท</span>
</div>
        </div>

        <div class="chart-combo">
          <div class="chart-combo__bar">
            <div class="panel__canvas panel__canvas--monthly">
              <canvas ref="monthlyChartRef"></canvas>
            </div>
          </div>
          <div class="chart-combo__pie">
            <div class="pie-heading">สัดส่วนรายเดือน</div>
            <div class="panel__canvas panel__canvas--doughnut">
              <canvas ref="monthlyPieRef"></canvas>
            </div>
            <div class="html-legend" :key="'ml-' + animKey">
              <div
                v-for="(item, i) in monthlyPieLegend"
                :key="i"
                class="html-legend__row anim-fade-in"
                :class="{
                  'html-legend__row--active': highlightedPieIndex === i,
                  'html-legend__row--dimmed':
                    highlightedPieIndex != null && highlightedPieIndex !== i
                }"
                :style="{ '--delay': i * 0.04 + 's' }"
                @mouseenter="highlightPieSegment('monthlyPie', i)"
                @mouseleave="unhighlightPieSegment('monthlyPie')"
              >
                <span
                  class="html-legend__dot"
                  :style="{ background: item.color }"
                ></span>
                <span class="html-legend__name">{{ item.label }}</span>
                <span class="html-legend__pct">{{ item.pct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Top 10 (data-driven) ═══ -->
      <div class="twin-grid">
        <div v-for="cfg in topTenConfigs" :key="cfg.key" class="panel">
          <div class="panel__head">
            <div>
              <div class="panel__title">
                <q-icon
                  :name="cfg.icon"
                  size="20px"
                  :color="cfg.iconColor"
                  class="q-mr-xs"
                />
                {{ cfg.title }}
              </div>
              <div class="panel__sub">{{ getTopTenSubLabel(cfg) }}</div>
            </div>
            <span class="tag" :class="cfg.tagClass">{{ cfg.tagLabel }}</span>
          </div>

          <!-- HTML Bar Chart -->
          <div class="hbar" :key="'hbar-' + cfg.key + '-' + topTenAnimKey">
            <div
              v-for="(item, i) in cfg.items.value"
              :key="i"
              class="hbar__row anim-slide-up"
              :class="{
                'hbar__row--active': topTenHighlight[cfg.key] === i,
                'hbar__row--dimmed':
                  topTenHighlight[cfg.key] != null &&
                  topTenHighlight[cfg.key] !== i
              }"
              :style="{ '--delay': i * 0.06 + 's' }"
              @mouseenter="onBarHover(cfg.key, i)"
              @mouseleave="onBarLeave(cfg.key)"
              @click="onBarClick(cfg.key, i)"
            >
              <div class="hbar__rank">#{{ i + 1 }}</div>
              <div class="hbar__info">
                <div class="hbar__label">{{ item.name }}</div>
                <div class="hbar__track">
                  <div
                    :class="['hbar__fill', cfg.fillClass, 'anim-bar-grow']"
                    :style="{ width: item.pct + '%', '--delay': i * 0.06 + 0.15 + 's' }"
                  >
                    <span v-if="item.pct > 25" class="hbar__val-inside">{{
                      fmtShort(item.value)
                    }}</span>
                  </div>
                  <span v-if="item.pct <= 25" class="hbar__val-outside">{{
                    fmtShort(item.value)
                  }}</span>
                </div>
              </div>
              <q-tooltip
                class="hbar-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 8]"
                transition-show="scale"
                transition-hide="scale"
              >
                <div class="hbar-tooltip__name">{{ item.name }}</div>
                <div class="hbar-tooltip__val">
                  มูลค่า: {{ formatCurrency(item.value) }} บาท
                </div>
                <div class="hbar-tooltip__pct">
                  สัดส่วน: {{ item.sharePct.toFixed(1) }}%
                </div>
              </q-tooltip>
            </div>
            <div v-if="!cfg.items.value.length" class="hbar__empty">
              ไม่มีข้อมูล
            </div>
          </div>

          <!-- Pie -->
          <div class="pie-section">
            <div class="pie-heading">สัดส่วนมูลค่า{{ cfg.tagLabel }}</div>
            <div class="panel__canvas panel__canvas--doughnut">
              <canvas
                :ref="
                  el => setTopTenCanvas(cfg.key, el as HTMLCanvasElement | null)
                "
              ></canvas>
            </div>
            <div class="html-legend" :key="'lg-' + cfg.key + '-' + topTenAnimKey">
              <div
                v-for="(item, i) in cfg.legend.value"
                :key="i"
                class="html-legend__row anim-fade-in"
                :class="{
                  'html-legend__row--active': topTenHighlight[cfg.key] === i,
                  'html-legend__row--dimmed':
                    topTenHighlight[cfg.key] != null &&
                    topTenHighlight[cfg.key] !== i
                }"
                :style="{ '--delay': i * 0.04 + 's' }"
                @mouseenter="onBarHover(cfg.key, i)"
                @mouseleave="onBarLeave(cfg.key)"
                @click="onBarClick(cfg.key, i)"
              >
                <span
                  class="html-legend__dot"
                  :style="{ background: item.color }"
                ></span>
                <span class="html-legend__name">{{ item.label }}</span>
                <span class="html-legend__pct">{{ item.pct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dash-footer">
      ระบบคลังเวชภัณฑ์ · อัปเดตล่าสุด {{ lastUpdated }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  reactive,
  type Ref
} from "vue";
import { api } from "@/boot/axios";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  Filler
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  Filler
);

/* ════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════ */

interface LegendItem {
  label: string;
  color: string;
  pct: string;
  value: number;
}

interface BarItem {
  name: string;
  value: number;
  pct: number;
  sharePct: number;
}

interface MonthlyRecord {
  month: number;
  medSupply: number;
}

interface TopTenRecord {
  name: string;
  total: number;
}

interface TopTenPanelConfig {
  key: string;
  title: string;
  icon: string;
  iconColor: string;
  tagLabel: string;
  tagClass: string;
  fillClass: string;
  endpoint: string;
  palette: readonly string[];
  items: Ref<BarItem[]>;
  legend: Ref<LegendItem[]>;
  useMonth: boolean;
}

/* ════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════ */

const THAI_MONTHS_SHORT = [
  "",
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค."
] as const;

const THAI_MONTHS_FULL = [
  "",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม"
] as const;

const FISCAL_MONTH_ORDER = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const MONTH_OPTIONS = [
  { label: "ตุลาคม", value: 10 },
  { label: "พฤศจิกายน", value: 11 },
  { label: "ธันวาคม", value: 12 },
  { label: "มกราคม", value: 1 },
  { label: "กุมภาพันธ์", value: 2 },
  { label: "มีนาคม", value: 3 },
  { label: "เมษายน", value: 4 },
  { label: "พฤษภาคม", value: 5 },
  { label: "มิถุนายน", value: 6 },
  { label: "กรกฎาคม", value: 7 },
  { label: "สิงหาคม", value: 8 },
  { label: "กันยายน", value: 9 }
] as const;

const PALETTE = {
  orange: [
    "#E86D3A",
    "#F2945C",
    "#F7B78D",
    "#FBCFB0",
    "#FDE3CE",
    "#D4572A",
    "#C44A20",
    "#FF9F6B",
    "#FFB98A",
    "#FFDCC4",
    "#B83E15",
    "#A33510"
  ],
  teal: [
    "#0D9488",
    "#14B8A6",
    "#2DD4BF",
    "#5EEAD4",
    "#99F6E4",
    "#0F766E",
    "#115E59",
    "#0EA5A0",
    "#3BC9C0",
    "#7EE0D8"
  ],
  coral: [
    "#E86D3A",
    "#F28B5C",
    "#F7A87D",
    "#FBC09E",
    "#FDD8BF",
    "#D95A28",
    "#C94C1E",
    "#FF8F5A",
    "#FFAB7E",
    "#FFC9A5"
  ]
} as const;

const CHART_FONT = {
  family: "'Sarabun','Inter',sans-serif",
  size: 12
} as const;
const GRID_COLOR = "rgba(0,0,0,0.04)";
const TICK_COLOR = "rgba(0,0,0,0.5)";
const TOOLTIP_BG = "rgba(27,37,89,0.95)";
const START_YEAR = 2020;

/* ── Threshold-based coloring ── */
const STOCK_THRESHOLD = 60;

const COLOR = {
  good:     "#EF4444",                        // แดง (≥ 60)
  goodFill: "rgba(239, 68, 68, 0.18)",
  goodPie:  "#EF4444",
  warn:     "#FACC15",                        // เหลือง (< 60)
  warnFill: "rgba(250, 204, 21, 0.18)",
  warnPie:  "#FACC15"
} as const;

/** Return color pair for a single value */
function thresholdColor(val: number) {
  return val < STOCK_THRESHOLD
    ? { line: COLOR.warn, fill: COLOR.warnFill, pie: COLOR.warnPie }
    : { line: COLOR.good, fill: COLOR.goodFill, pie: COLOR.goodPie };
}

/* ════════════════════════════════════════════════
   Formatting helpers
   ════════════════════════════════════════════════ */

function formatCurrency(val: number): string {
  return (val ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function fmtShort(val: number): string {
  return val.toLocaleString("th-TH");
}

function formatAxisValue(val: number): string {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(0) + "K";
  return val.toLocaleString("th-TH");
}

function isMobile(): boolean {
  return typeof window !== "undefined" && window.innerWidth <= 599;
}

/* ════════════════════════════════════════════════
   Data helpers
   ════════════════════════════════════════════════ */

function buildLegendItems(
  labels: string[],
  values: number[],
  palette: readonly string[]
): LegendItem[] {
  const total = values.reduce((a, b) => a + b, 0);
  return labels.map((label, i) => ({
    label,
    color: palette[i % palette.length] ?? "#999999",
    pct: total > 0 ? (((values[i] ?? 0) / total) * 100).toFixed(1) : "0.0",
    value: values[i] ?? 0
  }));
}

function toBarItems(names: string[], values: number[]): BarItem[] {
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  return names.map((name, i) => ({
    name,
    value: values[i] ?? 0,
    pct: ((values[i] ?? 0) / max) * 100,
    sharePct: total > 0 ? ((values[i] ?? 0) / total) * 100 : 0
  }));
}

function updateTimestamp(): void {
  lastUpdated.value = new Date().toLocaleString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* ════════════════════════════════════════════════
   Reactive state
   ════════════════════════════════════════════════ */

const loading = ref(false);
const totalSKU = ref(0);
const stockValue = ref(0);
const lastUpdated = ref("");

/** Incremented every fetch — used as :key to re-mount animated elements */
const animKey = ref(0);
/** Separate key for Top 10 only (month change) */
const topTenAnimKey = ref(0);

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentFiscalYear =
  currentMonth >= 10 ? now.getFullYear() + 1 : now.getFullYear();

const fiscalYear = ref(currentFiscalYear);
const selectedMonth = ref<number | null>(null);

const buddhistFiscalYear = computed(() => fiscalYear.value + 543);

// Interactive state: which pie/bar index is highlighted
const highlightedPieIndex = ref<number | null>(null);
const topTenHighlight = reactive<Record<string, number | null>>({
  stock: null,
  transout: null
});

/* ════════════════════════════════════════════════
   Animated count-up
   ════════════════════════════════════════════════ */

function useCountUp(
  source: Ref<number>,
  opts: { duration?: number; decimals?: number } = {}
) {
  const { duration = 1200, decimals = 0 } = opts;
  const display = ref(0);
  const isAnimating = ref(false);
  let raf = 0;

  function easeOutExpo(t: number): number {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  watch(
    source,
    (to, from) => {
      const start = from ?? 0;
      const delta = to - start;
      if (delta === 0) {
        display.value = to;
        return;
      }

      cancelAnimationFrame(raf);
      isAnimating.value = true;
      const t0 = performance.now();

      function tick(now: number) {
        const elapsed = now - t0;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        display.value = parseFloat((start + delta * eased).toFixed(decimals));

        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          display.value = to;
          isAnimating.value = false;
        }
      }

      raf = requestAnimationFrame(tick);
    },
    { immediate: true }
  );

  onUnmounted(() => cancelAnimationFrame(raf));

  const formatted = computed(() =>
    display.value.toLocaleString("th-TH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  );

  return { display, formatted, isAnimating };
}

const animSKU = useCountUp(totalSKU, { duration: 1400 });
const animStock = useCountUp(stockValue, { duration: 1800 });

// Top 10 data
const topStockItems = ref<BarItem[]>([]);
const topTransOutItems = ref<BarItem[]>([]);

// Canvas refs
const monthlyChartRef = ref<HTMLCanvasElement | null>(null);
const monthlyPieRef = ref<HTMLCanvasElement | null>(null);

const topTenCanvasRefs = new Map<string, HTMLCanvasElement | null>();

function setTopTenCanvas(key: string, el: HTMLCanvasElement | null): void {
  topTenCanvasRefs.set(key, el);
}

// Legend data
const monthlyPieLegend = ref<LegendItem[]>([]);
const topStockPieLegend = ref<LegendItem[]>([]);
const topTransOutPieLegend = ref<LegendItem[]>([]);

/* ════════════════════════════════════════════════
   Chart instance registry
   ════════════════════════════════════════════════ */

const charts = new Map<string, Chart>();

function destroyChart(key: string): void {
  charts.get(key)?.destroy();
  charts.delete(key);
}

function destroyAllCharts(): void {
  for (const chart of charts.values()) chart.destroy();
  charts.clear();
}

function resizeAllCharts(): void {
  for (const chart of charts.values()) chart.resize();
}

/* ════════════════════════════════════════════════
   Interactive: Cross-chart highlighting
   ════════════════════════════════════════════════ */

function highlightPieSegment(chartKey: string, index: number): void {
  highlightedPieIndex.value = index;
  const chart = charts.get(chartKey);
  if (!chart) return;
  chart.setActiveElements([{ datasetIndex: 0, index }]);
  chart.tooltip?.setActiveElements([{ datasetIndex: 0, index }], { x: 0, y: 0 });
  chart.update("none");
}

function unhighlightPieSegment(chartKey: string): void {
  highlightedPieIndex.value = null;
  const chart = charts.get(chartKey);
  if (!chart) return;
  chart.setActiveElements([]);
  chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
  chart.update("none");
}

/** Hover on bar row → highlight corresponding pie segment */
function onBarHover(cfgKey: string, index: number): void {
  topTenHighlight[cfgKey] = index;
  const chart = charts.get(cfgKey);
  if (!chart) return;
  chart.setActiveElements([{ datasetIndex: 0, index }]);
  chart.tooltip?.setActiveElements([{ datasetIndex: 0, index }], { x: 0, y: 0 });
  chart.update("none");
}

function onBarLeave(cfgKey: string): void {
  topTenHighlight[cfgKey] = null;
  const chart = charts.get(cfgKey);
  if (!chart) return;
  chart.setActiveElements([]);
  chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
  chart.update("none");
}

/** Click on bar row → toggle persistent highlight */
function onBarClick(cfgKey: string, index: number): void {
  // Toggle: if already selected, clear
  if (topTenHighlight[cfgKey] === index) {
    topTenHighlight[cfgKey] = null;
  } else {
    topTenHighlight[cfgKey] = index;
  }
}

/* ════════════════════════════════════════════════
   Summary cards
   ════════════════════════════════════════════════ */

const summaryCards = computed(() => [
  {
    key: "sku",
    icon: "category",
    label: "จำนวน SKU ทั้งหมด",
    display: animSKU.formatted.value,
    unit: "รายการ",
    color: "#4361EE",
    iconBg: "rgba(67,97,238,0.12)",
    animating: animSKU.isAnimating.value
  },
  {
    key: "value",
    icon: "account_balance_wallet",
    label: "มูลค่าคงคลังรวม",
    display: animStock.formatted.value,
    unit: "บาท",
    color: "#7B2FF7",
    iconBg: "rgba(123,47,247,0.12)",
    animating: animStock.isAnimating.value
  }
]);

/* ════════════════════════════════════════════════
   Top-ten panel configs
   ════════════════════════════════════════════════ */

const topTenConfigs: TopTenPanelConfig[] = [
  {
    key: "stock",
    title: "Top 10 มูลค่าคงคลัง",
    icon: "inventory_2",
    iconColor: "teal-5",
    tagLabel: "คงคลัง",
    tagClass: "tag--teal",
    fillClass: "hbar__fill--teal",
    endpoint: "/dashboard/TopTenStock",
    palette: PALETTE.teal,
    items: topStockItems,
    legend: topStockPieLegend,
    useMonth: true
  },
  {
    key: "transout",
    title: "Top 10 มูลค่าจ่ายออก",
    icon: "local_shipping",
    iconColor: "deep-orange-4",
    tagLabel: "จ่ายออก",
    tagClass: "tag--coral",
    fillClass: "hbar__fill--coral",
    endpoint: "/dashboard/TopTenTransOut",
    palette: PALETTE.coral,
    items: topTransOutItems,
    legend: topTransOutPieLegend,
    useMonth: false
  }
];

function getTopTenSubLabel(cfg: TopTenPanelConfig): string {
  if (selectedMonth.value) {
    return `${THAI_MONTHS_FULL[selectedMonth.value]} · ปีงบ ${buddhistFiscalYear.value}`;
  }
  return `ทุกเดือน · ปีงบ ${buddhistFiscalYear.value}`;
}

/* ════════════════════════════════════════════════
   Fiscal year options
   ════════════════════════════════════════════════ */

const fiscalYearOptions = Array.from(
  { length: currentFiscalYear - START_YEAR + 1 },
  (_, i) => {
    const y = START_YEAR + i;
    const beFiscal = y + 543;
    const beStart = beFiscal - 1;
    const star = y === currentFiscalYear ? " ★" : "";
    return {
      label: `พ.ศ. ${beFiscal} (ต.ค. ${beStart} – ก.ย. ${beFiscal})${star}`,
      value: y
    };
  }
);

const filteredFiscalYearOptions = ref(fiscalYearOptions);

function filterFiscalYear(val: string, update: (fn: () => void) => void): void {
  update(() => {
    const needle = val?.trim().toLowerCase();
    filteredFiscalYearOptions.value = needle
      ? fiscalYearOptions.filter(o => o.label.toLowerCase().includes(needle))
      : fiscalYearOptions;
  });
}

/* ════════════════════════════════════════════════
   API
   ════════════════════════════════════════════════ */

async function fetchAll(): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  try {
    await Promise.all([
      fetchTotalSKU(),
      fetchTotalStockValue(),
      fetchMonthlyStockValue(),
      ...topTenConfigs.map(fetchTopTen)
    ]);
    updateTimestamp();
    animKey.value++;
    topTenAnimKey.value++;
  } finally {
    loading.value = false;
  }
}

/** Only re-fetch Top 10 panels (month filter changed, no need to redraw line chart) */
async function fetchTopTenOnly(): Promise<void> {
  try {
    await Promise.all(topTenConfigs.map(fetchTopTen));
    updateTimestamp();
    topTenAnimKey.value++;
  } catch (e) {
    console.error("[Dashboard] fetchTopTenOnly:", e);
  }
}

async function fetchTotalSKU(): Promise<void> {
  try {
    const { data } = await api.get<{ total_of_SKU?: number }>(
      "/dashboard/totalSKU"
    );
    totalSKU.value = data?.total_of_SKU ?? 0;
  } catch (e) {
    console.error("[Dashboard] fetchTotalSKU:", e);
  }
}

async function fetchTotalStockValue(): Promise<void> {
  try {
    const { data } = await api.get<{ total_stock_value?: number }>(
      "/dashboard/totalStockValue"
    );
    stockValue.value = data?.total_stock_value ?? 0;
  } catch (e) {
    console.error("[Dashboard] fetchTotalStockValue:", e);
  }
}

async function fetchMonthlyStockValue(): Promise<void> {
  try {
    const { data } = await api.get<{ months?: MonthlyRecord[] }>(
      "/dashboard/MonthlyStockValue",
      { params: { financialYear: fiscalYear.value } }
    );

    const months = data?.months ?? [];
    const labels = months.map(
      m => THAI_MONTHS_SHORT[m.month] ?? String(m.month)
    );
    const values = months.map(m => m.medSupply);
    const monthIndices = months.map(m => m.month);

    await nextTick();

    // Build threshold-based color arrays for monthly charts
    const thresholdPalette = values.map(v => thresholdColor(v).pie);

    renderMonthlyLineChart(labels, values, monthIndices);
    monthlyPieLegend.value = buildLegendItems(labels, values, thresholdPalette);
    renderDoughnut(
      "monthlyPie",
      monthlyPieRef.value,
      labels,
      values,
      thresholdPalette
    );
  } catch (e) {
    console.error("[Dashboard] fetchMonthlyStockValue:", e);
  }
}

async function fetchTopTen(cfg: TopTenPanelConfig): Promise<void> {
  try {
    const params: Record<string, number> = { financialYear: fiscalYear.value };
    if (selectedMonth.value != null) params.month = selectedMonth.value;

    const { data } = await api.get<TopTenRecord[]>(cfg.endpoint, { params });
    const items = Array.isArray(data) ? data : [];
    const labels = items.map(d => d.name);
    const values = items.map(d => d.total);

    cfg.items.value = toBarItems(labels, values);
    cfg.legend.value = buildLegendItems(labels, values, cfg.palette);

    await nextTick();

    const canvas = topTenCanvasRefs.get(cfg.key) ?? null;
    renderDoughnut(cfg.key, canvas, labels, values, cfg.palette);
  } catch (e) {
    console.error(`[Dashboard] fetchTopTen(${cfg.key}):`, e);
  }
}

/* ════════════════════════════════════════════════
   Chart.js — Line-reveal + Crosshair plugin
   ════════════════════════════════════════════════ */

/**
 * Progressive clip-reveal: the line + fill "draw" from left to right,
 * then points pop in one by one.  After the reveal the clip is removed
 * so hover / tooltip work normally.
 */
const lineRevealPlugin = {
  id: "lineReveal",

  beforeDraw(chart: Chart) {
    const meta = (chart as any).__reveal;
    if (!meta || meta.progress >= 1) return;

    const { ctx, chartArea } = chart;
    const w = chartArea.right - chartArea.left;
    const revealX = chartArea.left + w * meta.progress;

    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, 0, revealX - chartArea.left, chart.height);
    ctx.clip();
  },

  afterDraw(chart: Chart) {
    const meta = (chart as any).__reveal;
    if (!meta || meta.progress >= 1) return;
    chart.ctx.restore();
  },

  afterRender(chart: Chart) {
    // also draw crosshair for active element
    const active = chart.getActiveElements();
    if (!active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0]!.element.x;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
    ctx.lineWidth = 1;
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  }
};

/** Kick off the reveal animation after chart is created */
function startLineReveal(chart: Chart, duration = 1600): void {
  const meta = { progress: 0 };
  (chart as any).__reveal = meta;

  const t0 = performance.now();

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now: number) {
    const elapsed = now - t0;
    const raw = Math.min(elapsed / duration, 1);
    meta.progress = easeOutCubic(raw);
    chart.draw();

    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      meta.progress = 1;
      chart.draw();
    }
  }

  requestAnimationFrame(tick);
}

/**
 * Doughnut circular-sweep reveal: segments sweep clockwise from 12 o'clock.
 * Uses a wedge-shaped clip that grows from 0° → 360°.
 */
const doughnutRevealPlugin = {
  id: "doughnutReveal",

  beforeDraw(chart: Chart) {
    const meta = (chart as any).__doughnutReveal;
    if (!meta || meta.progress >= 1) return;

    const { ctx, chartArea } = chart;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    // Radius large enough to cover the entire chart
    const r = Math.max(chart.width, chart.height);

    const startAngle = -Math.PI / 2; // 12 o'clock
    const endAngle = startAngle + Math.PI * 2 * meta.progress;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.clip();
  },

  afterDraw(chart: Chart) {
    const meta = (chart as any).__doughnutReveal;
    if (!meta || meta.progress >= 1) return;
    chart.ctx.restore();
  }
};

/** Kick off the doughnut sweep animation */
function startDoughnutReveal(chart: Chart, duration = 1200): void {
  const meta = { progress: 0 };
  (chart as any).__doughnutReveal = meta;

  const t0 = performance.now();

  function easeOutQuart(t: number) {
    return 1 - Math.pow(1 - t, 4);
  }

  function tick(now: number) {
    const elapsed = now - t0;
    const raw = Math.min(elapsed / duration, 1);
    meta.progress = easeOutQuart(raw);
    chart.draw();

    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      meta.progress = 1;
      chart.draw();
    }
  }

  requestAnimationFrame(tick);
}

/* ════════════════════════════════════════════════
   Chart.js — Threshold line plugin
   ════════════════════════════════════════════════ */

const thresholdLinePlugin = {
  id: "thresholdLine",
  afterDraw(chart: Chart) {
    const yScale = chart.scales["y"];
    if (!yScale) return;

    const yPixel = yScale.getPixelForValue(STOCK_THRESHOLD);
    if (yPixel < chart.chartArea.top || yPixel > chart.chartArea.bottom) return;

    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.moveTo(chartArea.left, yPixel);
    ctx.lineTo(chartArea.right, yPixel);
    ctx.stroke();

    // Label
    ctx.setLineDash([]);
    ctx.font = `600 11px ${CHART_FONT.family}`;
    ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
    ctx.textAlign = "right";
    ctx.fillText(`เกณฑ์ ${STOCK_THRESHOLD} บาท`, chartArea.right - 4, yPixel - 5);
    ctx.restore();
  }
};

/* ════════════════════════════════════════════════
   Chart rendering
   ════════════════════════════════════════════════ */

function baseTooltipStyle(): Record<string, unknown> {
  return {
    backgroundColor: TOOLTIP_BG,
    titleColor: "#fff",
    bodyColor: "rgba(255,255,255,0.9)",
    titleFont: { ...CHART_FONT, weight: "bold" as const, size: 14 },
    bodyFont: { ...CHART_FONT, size: 13 },
    padding: { top: 12, bottom: 12, left: 16, right: 16 },
    cornerRadius: 14,
    titleMarginBottom: 8
  };
}

function renderMonthlyLineChart(
  labels: string[],
  values: number[],
  monthIndices: number[]
): void {
  destroyChart("monthly");
  if (!monthlyChartRef.value) return;

  const mobile = isMobile();

  // Per-point colors based on threshold
  const pointBorderColors = values.map(v => thresholdColor(v).line);
  const pointHoverBgColors = values.map(v => thresholdColor(v).line);

  const chart = new Chart(monthlyChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "อัตราสำรองเวชภัณฑ์",
          data: values,
          // Segment-level coloring: line + fill change per segment
          segment: {
            borderColor: (ctx: any) => {
              const v = ctx.p1.parsed.y;
              return thresholdColor(v).line;
            },
            backgroundColor: (ctx: any) => {
              const v = ctx.p1.parsed.y;
              return thresholdColor(v).fill;
            }
          },
          borderColor: COLOR.good,  // fallback
          borderWidth: 3,
          backgroundColor: COLOR.goodFill,  // fallback
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: pointBorderColors,
          pointBorderWidth: 2.5,
          pointRadius: mobile ? 4 : 6,
          pointHoverRadius: mobile ? 8 : 11,
          pointHoverBackgroundColor: pointHoverBgColors,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      hover: { mode: "index", intersect: false },
      // Disable default animation — the reveal plugin handles it
      animation: false as any,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...baseTooltipStyle(),
          enabled: true,
          displayColors: false,
          caretSize: 7,
          caretPadding: 8,
          callbacks: {
            title(items) {
              const idx = items[0]?.dataIndex ?? 0;
              const monthIdx =
                monthIndices[idx] ?? FISCAL_MONTH_ORDER[idx] ?? idx + 1;
              const yr =
                monthIdx >= 10 ? fiscalYear.value - 1 : fiscalYear.value;
              return `${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${yr + 543}`;
            },
            label(ctx) {
              return `มูลค่า: ${(ctx.parsed.y ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 0 })} บาท`;
            },
            afterLabel(ctx) {
              const dataset = ctx.dataset.data as number[];
              const dataTotal = dataset.reduce(
                (a, b) => a + (Number(b) || 0),
                0
              );
              const pct =
                dataTotal > 0
                  ? (((ctx.parsed.y ?? 0) / dataTotal) * 100).toFixed(1)
                  : "0.0";
              const val = ctx.parsed.y ?? 0;
              const status = val < STOCK_THRESHOLD
              ? `🟡 ต่ำกว่าเกณฑ์ (< ${STOCK_THRESHOLD} บาท)`
    : `🔴 สูงกว่าเกณฑ์ (≥ ${STOCK_THRESHOLD} บาท)`;
              return `สัดส่วน: ${pct}% ของทั้งปี\n${status}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: TICK_COLOR,
            font: { ...CHART_FONT, size: mobile ? 10 : 12 },
            maxRotation: mobile ? 45 : 0
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: GRID_COLOR, drawTicks: false },
          border: { display: false },
          ticks: {
            color: TICK_COLOR,
            font: { ...CHART_FONT, size: mobile ? 10 : 12 },
            padding: 8,
            callback: v => formatAxisValue(Number(v))
          }
        }
      }
    },
    plugins: [lineRevealPlugin, thresholdLinePlugin]
  });

  charts.set("monthly", chart);

  // Start the flowing draw animation
  startLineReveal(chart, mobile ? 1200 : 1600);
}

function renderDoughnut(
  key: string,
  canvas: HTMLCanvasElement | null,
  labels: string[],
  values: number[],
  palette: readonly string[]
): void {
  destroyChart(key);
  if (!canvas || !values.length || values.every(v => v === 0)) return;

  const mobile = isMobile();
  const total = values.reduce((a, b) => a + b, 0);
  const colors = palette.slice(0, values.length);

  const chart = new Chart<"doughnut">(canvas, {
    type: "doughnut",
    data: {
      labels: [...labels],
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map(c => c + "DD"),
          borderWidth: 2,
          borderColor: "#fff",
          hoverBorderColor: "#fff",
          hoverOffset: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "52%",
      // Disable default animation — the sweep plugin handles it
      animation: false as any,
      layout: { padding: mobile ? 4 : 12 },
      onHover(event, elements, chart) {
        // Sync legend highlight for top-ten pies
        if (key === "stock" || key === "transout") {
          topTenHighlight[key] = elements.length ? elements[0]!.index : null;
        }
        if (key === "monthlyPie") {
          highlightedPieIndex.value = elements.length
            ? elements[0]!.index
            : null;
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...baseTooltipStyle(),
          displayColors: true,
          callbacks: {
            title: items => labels[items[0]?.dataIndex ?? 0],
            label(ctx) {
              const val = ctx.parsed ?? 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
              return ` ${val.toLocaleString("th-TH")} บาท (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [doughnutRevealPlugin]
  });

  charts.set(key, chart);

  // Start the circular sweep animation
  const duration = key === "monthlyPie" ? (mobile ? 1000 : 1400) : (mobile ? 800 : 1100);
  startDoughnutReveal(chart, duration);
}

/* ════════════════════════════════════════════════
   Resize (debounced)
   ════════════════════════════════════════════════ */

let resizeTimer: ReturnType<typeof setTimeout> | null = null;

function handleResize(): void {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeAllCharts, 200);
}

/* ════════════════════════════════════════════════
   Lifecycle
   ════════════════════════════════════════════════ */

onMounted(() => {
  window.addEventListener("resize", handleResize);
  fetchAll();
});

// ── fiscalYear changed → re-fetch everything (monthly chart + top 10)
watch(fiscalYear, () => {
  fetchAll();
});

// ── selectedMonth changed → re-fetch only Top 10 (line chart stays intact)
watch(selectedMonth, () => {
  fetchTopTenOnly();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (resizeTimer) clearTimeout(resizeTimer);
  destroyAllCharts();
});
</script>

<style scoped>
.dashboard-page {
  --bg: #eeeef4;
  --card: #ffffff;
  --hero-from: #161b40;
  --hero-to: #2b3580;
  --text-1: #1b2559;
  --text-2: #6b7a99;
  --text-3: #a0aec0;
  --border: rgba(27, 37, 89, 0.06);
  --shadow-sm: 0 1px 4px rgba(27, 37, 89, 0.05);
  --shadow-md: 0 6px 24px rgba(27, 37, 89, 0.07);
  --shadow-lg: 0 12px 40px rgba(27, 37, 89, 0.1);
  --r: 18px;
  --r-sm: 14px;

  background: var(--bg);
  min-height: 100vh;
  font-family: "Sarabun", "Inter", sans-serif;
  padding-bottom: 16px;
}

/* ═══ Transitions ═══ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ═══ Re-usable entry animations ═══ */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes barGrow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cardPop {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  60% {
    transform: translateY(-3px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.anim-slide-up {
  animation: fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.anim-bar-grow {
  transform-origin: left center;
  animation: barGrow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

.anim-fade-in {
  animation: fadeIn 0.4s ease both;
  animation-delay: var(--delay, 0s);
}

/* Stat cards entrance */
.stat-card {
  animation: cardPop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0s);
}

@media (prefers-reduced-motion: reduce) {
  .anim-slide-up,
  .anim-bar-grow,
  .anim-fade-in,
  .stat-card {
    animation: none !important;
  }
}

/* ═══ HERO ═══ */
.hero-header {
  position: relative;
  background: linear-gradient(145deg, var(--hero-from), var(--hero-to));
  padding: 36px 32px 80px;
  border-radius: 0 0 32px 32px;
  overflow: hidden;
  margin-bottom: -44px;
  z-index: 1;
}

.hero-decor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.07;
  background: #fff;
}
.hero-decor--1 {
  width: 280px;
  height: 280px;
  top: -80px;
  right: -60px;
}
.hero-decor--2 {
  width: 140px;
  height: 140px;
  bottom: 30px;
  left: -40px;
  opacity: 0.05;
}
.hero-decor--3 {
  width: 60px;
  height: 60px;
  top: 40px;
  right: 35%;
  opacity: 0.09;
}

.hero-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.hero-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
  animation: pulse-dot 2.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  font-family: "Inter", "Sarabun", sans-serif;
  letter-spacing: -0.8px;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6px;
}

/* ═══ STAT CARDS ═══ */
.card-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 1280px;
  margin: 28px auto 0;
  position: relative;
  z-index: 3;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--card);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--r);
  padding: 22px 20px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition:
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-card__shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.06),
    transparent
  );
  transition: left 0.6s;
  pointer-events: none;
}
.stat-card:hover .stat-card__shine {
  left: 120%;
}

.stat-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-card__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
}

.stat-card__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-card__value {
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  font-family: "Inter", "Sarabun", sans-serif;
  letter-spacing: -0.8px;
}

.stat-card__unit {
  font-size: 13px;
  color: var(--text-3);
  font-weight: 500;
}

/* ═══ Count-up animation states ═══ */
.stat-card--counting {
  border-color: rgba(255, 255, 255, 0.25);
}

.stat-card__value--counting {
  font-variant-numeric: tabular-nums;
}

.stat-card__icon--pulse {
  animation: icon-pulse 0.8s ease-in-out infinite alternate;
}

@keyframes icon-pulse {
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  100% {
    transform: scale(1.08);
    opacity: 1;
  }
}

/* ═══ CONTENT ═══ */
.content-area {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 2;
}

/* ═══ FILTER ═══ */
.filter-bar {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  margin: 20px 0;
}

.filter-bar__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 12px;
}

.filter-bar__fields {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-field {
  flex: 0 1 auto;
}
.filter-field :deep(.q-field__control) {
  border-radius: 12px !important;
}
.filter-field :deep(.q-field__native),
.filter-field :deep(.q-field__label) {
  font-size: 13px;
}
.fiscal-field {
  width: 300px;
  max-width: 100%;
}
.month-field {
  width: 160px;
  max-width: 100%;
}

/* ═══ PANEL ═══ */
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}
.panel:hover {
  box-shadow: var(--shadow-md);
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.panel__title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
}

.panel__sub {
  font-size: 13px;
  color: var(--text-2);
  margin-top: 3px;
}

.panel__canvas {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}
.panel__canvas canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
.panel__canvas--monthly {
  height: 380px;
}
.panel__canvas--doughnut {
  height: 300px;
}

/* ═══ CHART COMBO ═══ */
.chart-combo {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.chart-combo__bar {
  flex: 3;
  min-width: 0;
}
.chart-combo__pie {
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ═══ HTML BAR CHART ═══ */
.hbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hbar__row {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 10px;
  margin: -4px -6px;
  transition:
    opacity 0.3s ease,
    background 0.3s ease,
    transform 0.2s ease;
}

.hbar__row--active {
  background: rgba(0, 0, 0, 0.035);
  transform: scale(1.01);
}

.hbar__row--dimmed {
  opacity: 0.35;
}

.hbar:hover .hbar__row:not(.hbar__row--dimmed):hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.025);
}

.hbar:hover .hbar__row:not(.hbar__row--dimmed):hover .hbar__fill--teal {
  background: linear-gradient(
    90deg,
    rgba(14, 165, 160, 0.75),
    rgba(13, 148, 136, 1)
  );
}
.hbar:hover .hbar__row:not(.hbar__row--dimmed):hover .hbar__fill--coral {
  background: linear-gradient(
    90deg,
    rgba(232, 109, 58, 0.75),
    rgba(220, 80, 50, 1)
  );
}

.hbar__rank {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.hbar__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hbar__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1.35;
  word-break: break-word;
}

.hbar__track {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  background: rgba(0, 0, 0, 0.025);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.hbar__fill {
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 10px;
  min-width: 4px;
  transition: filter 0.2s;
}

.hbar__fill--teal {
  background: linear-gradient(
    90deg,
    rgba(14, 165, 160, 0.55),
    rgba(13, 148, 136, 0.95)
  );
}
.hbar__fill--coral {
  background: linear-gradient(
    90deg,
    rgba(232, 109, 58, 0.55),
    rgba(220, 80, 40, 0.95)
  );
}

.hbar__val-inside {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.hbar__val-outside {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-2);
  white-space: nowrap;
  flex-shrink: 0;
}

.hbar__empty {
  text-align: center;
  padding: 32px;
  color: var(--text-3);
  font-size: 13px;
}

/* ═══ PIE / LEGEND ═══ */
.pie-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.pie-heading {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-2);
  margin-bottom: 12px;
}

.legend-inline {
  display: flex;
  align-items: center;
  gap: 7px;
}
.legend-inline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-inline__line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}
.legend-inline__text {
  font-size: 12px;
  color: var(--text-2);
}

.html-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 20px;
  margin-top: 16px;
}

.html-legend__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  min-width: 0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.3s ease,
    transform 0.2s ease;
}

.html-legend__row:hover {
  background: rgba(0, 0, 0, 0.03);
}

.html-legend__row--active {
  background: rgba(0, 0, 0, 0.04);
  transform: scale(1.02);
}

.html-legend__row--dimmed {
  opacity: 0.3;
}

.html-legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.html-legend__row:hover .html-legend__dot,
.html-legend__row--active .html-legend__dot {
  transform: scale(1.3);
}

.html-legend__name {
  font-size: 13px;
  color: var(--text-1);
  font-weight: 500;
  flex: 1;
  min-width: 0;
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.html-legend__pct {
  font-size: 12px;
  color: var(--text-2);
  font-weight: 600;
  flex-shrink: 0;
}

/* ═══ TAGS ═══ */
.tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 20px;
}
.tag--teal {
  background: rgba(14, 165, 160, 0.09);
  color: #0d9488;
}
.tag--coral {
  background: rgba(242, 132, 92, 0.09);
  color: #e86d3a;
}

/* ═══ LAYOUT ═══ */
.twin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.twin-grid .panel {
  margin-bottom: 0;
}

.dash-footer {
  text-align: center;
  padding: 24px 16px 8px;
  font-size: 12px;
  color: var(--text-3);
}

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1024px) {
  .twin-grid {
    grid-template-columns: 1fr;
  }
  .chart-combo {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .hero-header {
    padding: 28px 20px 72px;
    border-radius: 0 0 26px 26px;
  }
  .hero-title {
    font-size: 26px;
  }
  .content-area {
    padding: 0 16px;
  }
  .card-row {
    gap: 12px;
  }
  .stat-card {
    padding: 18px 16px;
    gap: 12px;
  }
  .stat-card__icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }
  .stat-card__value {
    font-size: 26px;
  }
  .panel {
    padding: 20px;
    border-radius: var(--r-sm);
  }
  .panel__canvas--monthly {
    height: 340px;
  }
  .panel__canvas--doughnut {
    height: 280px;
  }
  .fiscal-field {
    width: 240px;
  }
  .filter-bar {
    border-radius: var(--r-sm);
    padding: 14px 16px;
  }
  .chart-combo {
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 599px) {
  .hero-header {
    padding: 24px 16px 68px;
    border-radius: 0 0 24px 24px;
    margin-bottom: -40px;
  }
  .hero-decor--1 {
    width: 180px;
    height: 180px;
    top: -50px;
    right: -40px;
  }
  .hero-decor--3 {
    display: none;
  }
  .hero-eyebrow {
    font-size: 10px;
  }
  .hero-title {
    font-size: 24px;
  }
  .hero-subtitle {
    font-size: 12px;
  }
  .card-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 20px;
  }
  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border-radius: var(--r-sm);
  }
  .stat-card:hover {
    transform: none;
    box-shadow: var(--shadow-md);
  }
  .stat-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 11px;
  }
  .stat-card__icon :deep(.q-icon) {
    font-size: 20px !important;
  }
  .stat-card__label {
    font-size: 10px;
  }
  .stat-card__value {
    font-size: 22px;
  }
  .stat-card__unit {
    font-size: 11px;
  }
  .content-area {
    padding: 0 12px;
  }
  .filter-bar {
    padding: 12px;
    margin: 16px 0;
    border-radius: var(--r-sm);
  }
  .filter-bar__fields {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .fiscal-field,
  .month-field {
    width: 100% !important;
  }
  .panel {
    padding: 14px;
    margin-bottom: 14px;
    border-radius: var(--r-sm);
  }
  .panel__head {
    margin-bottom: 14px;
  }
  .panel__title {
    font-size: 14px;
  }
  .panel__sub {
    font-size: 12px;
  }
  .panel__canvas--monthly {
    height: 260px;
  }
  .panel__canvas--doughnut {
    height: 220px;
  }
  .twin-grid {
    gap: 14px;
  }
  .tag {
    font-size: 10px;
    padding: 3px 10px;
  }
  .chart-combo {
    flex-direction: column;
    gap: 14px;
  }
  .pie-section {
    margin-top: 16px;
    padding-top: 14px;
  }
  .pie-heading {
    font-size: 12px;
    margin-bottom: 8px;
  }
  .html-legend {
    grid-template-columns: 1fr;
    gap: 2px;
    margin-top: 12px;
  }
  .html-legend__name {
    font-size: 12px;
  }
  .html-legend__pct {
    font-size: 11px;
  }
  .html-legend__dot {
    width: 10px;
    height: 10px;
  }
  .hbar {
    gap: 8px;
  }
  .hbar__label {
    font-size: 12px;
  }
  .hbar__track {
    height: 24px;
    border-radius: 6px;
  }
  .hbar__fill {
    border-radius: 6px;
    padding: 0 6px;
  }
  .hbar__val-inside {
    font-size: 10px;
  }
  .hbar__val-outside {
    font-size: 10px;
  }
  .hbar__rank {
    font-size: 10px;
    min-width: 20px;
  }
}

@media (max-width: 380px) {
  .hero-header {
    padding: 20px 12px 60px;
    margin-bottom: -36px;
  }
  .hero-title {
    font-size: 22px;
  }
  .content-area {
    padding: 0 10px;
  }
  .card-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .stat-card {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 14px;
  }
  .stat-card__value {
    font-size: 22px;
  }
  .panel__canvas--monthly {
    height: 220px;
  }
  .panel__canvas--doughnut {
    height: 200px;
  }
  .panel {
    padding: 12px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .stat-card:hover {
    transform: none;
    box-shadow: var(--shadow-md);
  }
  .stat-card__shine {
    display: none;
  }
  .filter-field :deep(.q-field__control) {
    min-height: 44px;
  }
}
</style>

<!-- Global tooltip style (unscoped) -->
<style>
.hbar-tooltip {
  background: rgba(27, 37, 89, 0.95) !important;
  border-radius: 14px !important;
  padding: 12px 16px !important;
  font-family: "Sarabun", "Inter", sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.hbar-tooltip__name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
  line-height: 1.35;
}
.hbar-tooltip__val {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
}
.hbar-tooltip__pct {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
</style>