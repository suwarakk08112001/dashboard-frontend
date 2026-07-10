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
        <div v-for="card in summaryCards" :key="card.key" class="stat-card">
          <div class="stat-card__shine"></div>
          <div class="stat-card__icon" :style="{ background: card.iconBg }">
            <q-icon
              :name="card.icon"
              size="24px"
              :style="{ color: card.color }"
            />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ card.label }}</span>
            <div class="stat-card__row">
              <span class="stat-card__value" :style="{ color: card.color }">
                {{ loading ? "—" : card.display }}
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

      <!-- ═══ Monthly Bar Chart + Pie ═══ -->
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
            <!-- <span class="legend-inline__dot" style="background: #f2845c"></span> -->
            <span
              class="legend-inline__line"
              style="background: #e86d3a"
            ></span>
            <span class="legend-inline__text">อัตราสำรองเวชภัณฑ์</span>
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
            <div class="html-legend">
              <div
                v-for="(item, i) in monthlyPieLegend"
                :key="i"
                class="html-legend__row"
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

      <!-- ═══ Top 10 (data-driven — single template, two configs) ═══ -->
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
          <div class="hbar">
            <div
              v-for="(item, i) in cfg.items.value"
              :key="i"
              class="hbar__row"
            >
              <div class="hbar__label">{{ item.name }}</div>
              <div class="hbar__track">
                <div
                  :class="['hbar__fill', cfg.fillClass]"
                  :style="{ width: item.pct + '%' }"
                >
                  <span v-if="item.pct > 25" class="hbar__val-inside">{{
                    fmtShort(item.value)
                  }}</span>
                </div>
                <span v-if="item.pct <= 25" class="hbar__val-outside">{{
                  fmtShort(item.value)
                }}</span>
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
            <div class="html-legend">
              <div
                v-for="(item, i) in cfg.legend.value"
                :key="i"
                class="html-legend__row"
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
  // return labels.map((label, i) => ({
  //   label,
  //   color: palette[i % palette.length],
  //   pct: total > 0 ? ((values[i] / total) * 100).toFixed(1) : '0.0',
  //   value: values[i],
  // }));
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
  // return names.map((name, i) => ({
  //   name,
  //   value: values[i],
  //   pct: (values[i] / max) * 100,
  //   sharePct: total > 0 ? (values[i] / total) * 100 : 0,
  // }));
  // After
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

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentFiscalYear =
  currentMonth >= 10 ? now.getFullYear() + 1 : now.getFullYear();

const fiscalYear = ref(currentFiscalYear);
const selectedMonth = ref<number | null>(null);

const buddhistFiscalYear = computed(() => fiscalYear.value + 543);

// Top 10 data
const topStockItems = ref<BarItem[]>([]);
const topTransOutItems = ref<BarItem[]>([]);

// Canvas refs
const monthlyChartRef = ref<HTMLCanvasElement | null>(null);
const monthlyPieRef = ref<HTMLCanvasElement | null>(null);

// Dynamic canvas refs for top-ten pie charts (set via template :ref callback)
const topTenCanvasRefs = new Map<string, HTMLCanvasElement | null>();

function setTopTenCanvas(key: string, el: HTMLCanvasElement | null): void {
  topTenCanvasRefs.set(key, el);
}

// Legend data
const monthlyPieLegend = ref<LegendItem[]>([]);
const topStockPieLegend = ref<LegendItem[]>([]);
const topTransOutPieLegend = ref<LegendItem[]>([]);

/* ════════════════════════════════════════════════
   Chart instance registry (centralised lifecycle)
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
   Summary cards
   ════════════════════════════════════════════════ */

const summaryCards = computed(() => [
  {
    key: "sku",
    icon: "category",
    label: "จำนวน SKU ทั้งหมด",
    display: (totalSKU.value ?? 0).toLocaleString(),
    unit: "รายการ",
    color: "#4361EE",
    iconBg: "rgba(67,97,238,0.12)"
  },
  {
    key: "value",
    icon: "account_balance_wallet",
    label: "มูลค่าคงคลังรวม",
    display: formatCurrency(stockValue.value),
    unit: "บาท",
    color: "#7B2FF7",
    iconBg: "rgba(123,47,247,0.12)"
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

// function getTopTenSubLabel(cfg: TopTenPanelConfig): string {
//   if (!cfg.useMonth) return `ทุกเดือน · ปีงบ ${buddhistFiscalYear.value}`;
//   const month = selectedMonth.value ? THAI_MONTHS_FULL[selectedMonth.value] : THAI_MONTHS_FULL[currentMonth];
//   return `${month} · ปีงบ ${buddhistFiscalYear.value}`;
// }
function getTopTenSubLabel(cfg: TopTenPanelConfig): string {
  if (selectedMonth.value) {
    return `${THAI_MONTHS_FULL[selectedMonth.value]} · ปีงบ ${buddhistFiscalYear.value}`;
  }
  return `ทุกเดือน · ปีงบ ${buddhistFiscalYear.value}`;
}
// function getTopTenSubLabel(cfg: TopTenPanelConfig): string {
//   if (selectedMonth.value) {
//     return `${THAI_MONTHS_FULL[selectedMonth.value]} · ปีงบ ${buddhistFiscalYear.value}`;
//   }
//   const fallback = cfg.useMonth ? THAI_MONTHS_FULL[currentMonth] : "ทุกเดือน";
//   return `${fallback} · ปีงบ ${buddhistFiscalYear.value}`;
// }

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
  } finally {
    loading.value = false;
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
    // const labels = months.map((m) => THAI_MONTHS_SHORT[m.month]);
    const labels = months.map(
      m => THAI_MONTHS_SHORT[m.month] ?? String(m.month)
    );
    const values = months.map(m => m.medSupply);
    const monthIndices = months.map(m => m.month);

    await nextTick();

    renderMonthlyBarChart(labels, values, monthIndices);
    monthlyPieLegend.value = buildLegendItems(labels, values, PALETTE.orange);
    renderDoughnut(
      "monthlyPie",
      monthlyPieRef.value,
      labels,
      values,
      PALETTE.orange
    );
  } catch (e) {
    console.error("[Dashboard] fetchMonthlyStockValue:", e);
  }
}

/** Unified fetcher — driven by TopTenPanelConfig */
async function fetchTopTen(cfg: TopTenPanelConfig): Promise<void> {
  try {
    const params: Record<string, number> = { financialYear: fiscalYear.value };
    // if (cfg.useMonth && selectedMonth.value != null) params.month = selectedMonth.value;
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

type BarState = "normal" | "hovered";

const BAR_GRADIENT_STOPS: Record<BarState, [string, string]> = {
  hovered: ["rgba(220,80,60,0.85)", "rgba(200,55,35,1)"],
  normal: ["rgba(251,176,144,0.75)", "rgba(232,109,58,1.0)"]
};

function makeBarGradient(
  ctx2d: CanvasRenderingContext2D,
  bottom: number,
  top: number,
  state: BarState
): CanvasGradient {
  const g = ctx2d.createLinearGradient(0, bottom, 0, top);
  const [s0, s1] = BAR_GRADIENT_STOPS[state];
  g.addColorStop(0, s0);
  g.addColorStop(1, s1);
  return g;
}
function renderMonthlyBarChart(
  labels: string[],
  values: number[],
  monthIndices: number[]
): void {
  destroyChart("monthly");
  if (!monthlyChartRef.value) return;

  const mobile = isMobile();
  const ctx2d = monthlyChartRef.value.getContext("2d")!;

  // Gradient fill ใต้เส้น
  const gradientFill = ctx2d.createLinearGradient(0, 0, 0, 400);
  gradientFill.addColorStop(0, "rgba(232, 109, 58, 0.35)");
  gradientFill.addColorStop(0.6, "rgba(232, 109, 58, 0.08)");
  gradientFill.addColorStop(1, "rgba(232, 109, 58, 0)");

  const chart = new Chart(monthlyChartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "อัตราสำรองเวชภัณฑ์",
          data: values,
          borderColor: "#E86D3A",
          borderWidth: 3,
          backgroundColor: gradientFill,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#E86D3A",
          pointBorderWidth: 2.5,
          pointRadius: mobile ? 4 : 6,
          pointHoverRadius: mobile ? 6 : 9,
          pointHoverBackgroundColor: "#E86D3A",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      hover: { mode: "index", intersect: false },
      animation: { duration: 800, easing: "easeOutQuart" },
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
              return `สัดส่วน: ${pct}% ของทั้งปี`;
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
    }
  });

  charts.set("monthly", chart);
}
// function renderMonthlyBarChart(
//   labels: string[],
//   values: number[],
//   monthIndices: number[],
// ): void {
//   destroyChart("monthly");
//   if (!monthlyChartRef.value) return;

//   const mobile = isMobile();

//   const chart = new Chart(monthlyChartRef.value, {
//     type: "bar",
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "อัตราสำรองเวชภัณฑ์",
//           data: values,
//           backgroundColor(ctx) {
//             const chartInstance = ctx.chart;
//             const { ctx: canvasCtx, chartArea } = chartInstance;
//             if (!chartArea) return "rgba(232,109,58,0.8)";

//             const active = chartInstance.getActiveElements();
//             // const isHovered = active.length > 0 && active[0].index === ctx.dataIndex;
//             const isHovered =
//               active.length > 0 && active[0]?.index === ctx.dataIndex;
//             const state: BarState = isHovered ? "hovered" : "normal";

//             return makeBarGradient(
//               canvasCtx,
//               chartArea.bottom,
//               chartArea.top,
//               state,
//             );
//           },
//           borderWidth: 0,
//           borderRadius: mobile ? 4 : 8,
//           borderSkipped: false,
//           barPercentage: 0.55,
//           categoryPercentage: 0.65,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       interaction: { mode: "index", intersect: false },
//       hover: { mode: "index", intersect: false },
//       animation: { duration: 800, easing: "easeOutQuart" },
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           ...baseTooltipStyle(),
//           enabled: true,
//           displayColors: false,
//           caretSize: 7,
//           caretPadding: 8,
//           // callbacks: {
//           //   title(items) {
//           //     const idx = items[0].dataIndex;
//           //     const monthIdx = monthIndices[idx] ?? FISCAL_MONTH_ORDER[idx] ?? (idx + 1);
//           //     const yr = monthIdx >= 10 ? fiscalYear.value - 1 : fiscalYear.value;
//           //     return `${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${yr + 543}`;
//           //   },
//           //   label(ctx) {
//           //     return `มูลค่า: ${ctx.parsed.y.toLocaleString('th-TH', { minimumFractionDigits: 0 })} บาท`;
//           //   },
//           //   afterLabel(ctx) {
//           //     const dataset = ctx.dataset.data as number[];
//           //     const dataTotal = dataset.reduce((a, b) => a + (Number(b) || 0), 0);
//           //     const pct = dataTotal > 0 ? ((ctx.parsed.y / dataTotal) * 100).toFixed(1) : '0.0';
//           //     return `สัดส่วน: ${pct}% ของทั้งปี`;
//           //   },
//           // },
//           callbacks: {
//             title(items) {
//               const idx = items[0]?.dataIndex ?? 0;
//               const monthIdx =
//                 monthIndices[idx] ?? FISCAL_MONTH_ORDER[idx] ?? idx + 1;
//               const yr =
//                 monthIdx >= 10 ? fiscalYear.value - 1 : fiscalYear.value;
//               return `${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${yr + 543}`;
//             },
//             label(ctx) {
//               return `มูลค่า: ${(ctx.parsed.y ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 0 })} บาท`;
//             },
//             afterLabel(ctx) {
//               const dataset = ctx.dataset.data as number[];
//               const dataTotal = dataset.reduce(
//                 (a, b) => a + (Number(b) || 0),
//                 0,
//               );
//               const pct =
//                 dataTotal > 0
//                   ? (((ctx.parsed.y ?? 0) / dataTotal) * 100).toFixed(1)
//                   : "0.0";
//               return `สัดส่วน: ${pct}% ของทั้งปี`;
//             },
//           },
//         },
//       },
//       scales: {
//         x: {
//           grid: { display: false },
//           border: { display: false },
//           ticks: {
//             color: TICK_COLOR,
//             font: { ...CHART_FONT, size: mobile ? 10 : 12 },
//             maxRotation: mobile ? 45 : 0,
//           },
//         },
//         y: {
//           beginAtZero: true,
//           grid: { color: GRID_COLOR, drawTicks: false },
//           border: { display: false },
//           ticks: {
//             color: TICK_COLOR,
//             font: { ...CHART_FONT, size: mobile ? 10 : 12 },
//             padding: 8,
//             callback: (v) => formatAxisValue(Number(v)),
//           },
//         },
//       },
//     },
//   });

//   charts.set("monthly", chart);
// }

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

  const chart = new Chart(canvas, {
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
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "52%",
      animation: { duration: 900, easing: "easeOutQuart" },
      layout: { padding: mobile ? 4 : 12 },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...baseTooltipStyle(),
          displayColors: true,
          // callbacks: {
          //   title: (items) => labels[items[0].dataIndex],
          //   label(ctx) {
          //     const val = ctx.parsed;
          //     const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
          //     return ` ${val.toLocaleString("th-TH")} บาท (${pct}%)`;
          //   },
          // },
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
    }
  });

  charts.set(key, chart);
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
// เพิ่มตรงนี้
watch([fiscalYear, selectedMonth], () => {
  fetchAll();
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

.filter-search-btn {
  border-radius: 12px !important;
  padding: 8px 24px;
  font-weight: 700;
  min-height: 40px;
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
  flex-direction: column;
  gap: 4px;
  position: relative;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 8px;
  margin: -4px -6px;
  transition:
    opacity 0.25s ease,
    background 0.25s ease;
}

.hbar:hover .hbar__row:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.02);
}
.hbar:hover .hbar__row:hover .hbar__fill--teal {
  background: linear-gradient(
    90deg,
    rgba(14, 165, 160, 0.75),
    rgba(13, 148, 136, 1)
  );
}
.hbar:hover .hbar__row:hover .hbar__fill--coral {
  background: linear-gradient(
    90deg,
    rgba(232, 109, 58, 0.75),
    rgba(220, 80, 50, 1)
  );
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
  transition:
    width 0.8s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.2s;
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
/* .legend-inline__dot {
  width: 10px;
  height: 10px;
  border-radius: 4px;
} */
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
  padding: 5px 0;
  min-width: 0;
}

.html-legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
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
  .filter-search-btn {
    width: 100%;
    justify-content: center;
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
  .filter-search-btn {
    min-height: 44px;
  }
  .filter-field :deep(.q-field__control) {
    min-height: 44px;
  }
}
</style>

<!-- Global tooltip style (unscoped — q-tooltip renders outside component root) -->
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
