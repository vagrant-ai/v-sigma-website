export type ProviderKind =
  | "hyperscaler"
  | "neocloud"
  | "onprem"
  | "kubernetes"
  | "slurm"
  | "other";

export type Provider = {
  id: string;
  name: string;
  kind: ProviderKind;
  /**
   * Size of the provider's GPU footprint, in regions. A single region name
   * would be wrong — real providers serve a GPU from many at once — so the
   * card shows the reach instead. Omitted for capacity you run yourself.
   */
  regions?: number;
  /**
   * 1–2 character monogram for the provider's tile.
   *
   * Deliberately not a brand logo: real marks exist for only a handful of
   * these vendors, and mixing a few authentic logos with a dozen invented
   * ones would misrepresent the rest. A consistent monogram set makes the
   * rows scannable without implying a partnership we can't claim.
   *
   * Omitted for self-managed kinds, which get a drawn glyph instead.
   */
  monogram?: string;
};

export type Gpu = {
  id: string;
  name: string;
  vendor: string;
  memory: string;
  /** Rough generation label, used for grouping in the picker. */
  tier: "flagship" | "current" | "previous" | "inference" | "workstation";
  /** 0 = easy to get anywhere, 1 = almost impossible. Drives the fake feed. */
  scarcity: number;
  /** Reference USD per GPU-hour before per-provider adjustment. */
  basePrice: number;
  /** Extra search terms so "ada" or "grace" find the right card. */
  aliases?: string[];
  /** Shown up-front in the picker; the rest are reachable via search. */
  featured?: boolean;
};

/**
 * Two shapes of destination, which is why the diagram forks:
 *
 * - `market` — a roster of third-party vendors you buy capacity from, so the
 *   interesting detail is *which* provider has the GPU.
 * - `self` — infrastructure you already run. There is no vendor list; the
 *   only question is whether your own cluster has the GPU free.
 */
export type ProviderBranch = "market" | "self";

export const PROVIDER_KINDS: {
  id: ProviderKind;
  label: string;
  branch: ProviderBranch;
}[] = [
  { id: "hyperscaler", label: "Hyperscalers", branch: "market" },
  { id: "neocloud", label: "Neoclouds", branch: "market" },
  { id: "onprem", label: "On-prem", branch: "self" },
  { id: "kubernetes", label: "Kubernetes", branch: "self" },
  { id: "slurm", label: "Slurm", branch: "self" },
  // Catch-all for schedulers we integrate with on request.
  { id: "other", label: "Others", branch: "self" },
];

export const MARKET_KINDS = PROVIDER_KINDS.filter((k) => k.branch === "market");
export const SELF_KINDS = PROVIDER_KINDS.filter((k) => k.branch === "self");

const SELF_KIND_IDS = new Set<ProviderKind>(SELF_KINDS.map((k) => k.id));

/** True for capacity you already run, false for third-party markets. */
export function isSelfManaged(provider: Provider): boolean {
  return SELF_KIND_IDS.has(provider.kind);
}

export const PROVIDERS: Provider[] = [
  // Hyperscalers
  { id: "aws", name: "AWS", kind: "hyperscaler", regions: 24, monogram: "AW" },
  { id: "gcp", name: "Google Cloud", kind: "hyperscaler", regions: 28, monogram: "GC" },
  { id: "azure", name: "Azure", kind: "hyperscaler", regions: 32, monogram: "AZ" },

  // Neoclouds — GPU-native providers
  { id: "coreweave", name: "CoreWeave", kind: "neocloud", regions: 12, monogram: "CW" },
  { id: "lambda", name: "Lambda", kind: "neocloud", regions: 6, monogram: "λ" },
  { id: "nebius", name: "Nebius", kind: "neocloud", regions: 5, monogram: "NB" },
  { id: "together", name: "Together AI", kind: "neocloud", regions: 7, monogram: "TG" },
  { id: "runpod", name: "RunPod", kind: "neocloud", regions: 14, monogram: "RP" },
  { id: "modal", name: "Modal", kind: "neocloud", regions: 8, monogram: "MD" },

  // Self-managed capacity — one target per kind. No monogram: these get a
  // drawn glyph, since they're categories of infrastructure, not brands.
  { id: "onprem", name: "On-prem", kind: "onprem" },
  { id: "kubernetes", name: "Kubernetes", kind: "kubernetes" },
  { id: "slurm", name: "Slurm", kind: "slurm" },
  { id: "other", name: "Others", kind: "other" },
];

/**
 * What people point at v-sigma. The top band of the diagram, above the control
 * plane — the demand side, where the hardware below is the supply side.
 *
 * Deliberately generic categories rather than named frameworks: v-sigma
 * schedules the GPU, it doesn't care whether the training job is PyTorch or
 * JAX, and listing logos here would imply integrations we haven't claimed.
 */
export const WORKLOADS: { id: string; label: string; detail: string }[] = [
  { id: "training", label: "Training", detail: "multi-node runs" },
  { id: "inference", label: "Inference", detail: "served endpoints" },
  { id: "agents", label: "Agents", detail: "on-demand bursts" },
  { id: "finetune", label: "Fine-tuning", detail: "short-lived jobs" },
  { id: "notebooks", label: "Notebooks", detail: "interactive work" },
];

export const GPU_TIERS: { id: Gpu["tier"]; label: string }[] = [
  { id: "flagship", label: "Flagship" },
  { id: "current", label: "Current gen" },
  { id: "previous", label: "Previous gen" },
  { id: "inference", label: "Inference" },
  { id: "workstation", label: "Workstation" },
];

export const GPUS: Gpu[] = [
  // NVIDIA — flagship rack-scale
  {
    id: "gb300",
    name: "GB300",
    vendor: "NVIDIA",
    memory: "288 GB",
    tier: "flagship",
    scarcity: 0.94,
    basePrice: 14.5,
    aliases: ["blackwell", "ultra", "grace"],
  },
  {
    id: "gb200",
    name: "GB200",
    vendor: "NVIDIA",
    memory: "192 GB",
    tier: "flagship",
    scarcity: 0.85,
    basePrice: 11.2,
    aliases: ["blackwell", "grace", "nvl72"],
    featured: true,
  },
  {
    id: "b300",
    name: "B300",
    vendor: "NVIDIA",
    memory: "288 GB",
    tier: "flagship",
    scarcity: 0.88,
    basePrice: 12.4,
    aliases: ["blackwell", "ultra"],
  },
  {
    id: "b200",
    name: "B200",
    vendor: "NVIDIA",
    memory: "192 GB",
    tier: "flagship",
    scarcity: 0.7,
    basePrice: 8.6,
    aliases: ["blackwell"],
    featured: true,
  },
  // NVIDIA — current gen Hopper
  {
    id: "h200",
    name: "H200",
    vendor: "NVIDIA",
    memory: "141 GB",
    tier: "current",
    scarcity: 0.5,
    basePrice: 5.4,
    aliases: ["hopper"],
    featured: true,
  },
  {
    id: "h100",
    name: "H100",
    vendor: "NVIDIA",
    memory: "80 GB",
    tier: "current",
    scarcity: 0.32,
    basePrice: 3.9,
    aliases: ["hopper", "sxm", "pcie"],
    featured: true,
  },
  {
    id: "gh200",
    name: "GH200",
    vendor: "NVIDIA",
    memory: "144 GB",
    tier: "current",
    scarcity: 0.62,
    basePrice: 6.2,
    aliases: ["grace", "hopper", "superchip"],
  },
  // NVIDIA — previous gen
  {
    id: "a100-80",
    name: "A100 80GB",
    vendor: "NVIDIA",
    memory: "80 GB",
    tier: "previous",
    scarcity: 0.12,
    basePrice: 1.8,
    aliases: ["ampere"],
    featured: true,
  },
  {
    id: "a100-40",
    name: "A100 40GB",
    vendor: "NVIDIA",
    memory: "40 GB",
    tier: "previous",
    scarcity: 0.08,
    basePrice: 1.35,
    aliases: ["ampere"],
  },
  {
    id: "v100",
    name: "V100",
    vendor: "NVIDIA",
    memory: "32 GB",
    tier: "previous",
    scarcity: 0.05,
    basePrice: 0.72,
    aliases: ["volta"],
  },
  // NVIDIA — inference / mid-range
  {
    id: "l40s",
    name: "L40S",
    vendor: "NVIDIA",
    memory: "48 GB",
    tier: "inference",
    scarcity: 0.22,
    basePrice: 1.55,
    aliases: ["ada", "lovelace"],
    featured: true,
  },
  {
    id: "l4",
    name: "L4",
    vendor: "NVIDIA",
    memory: "24 GB",
    tier: "inference",
    scarcity: 0.1,
    basePrice: 0.68,
    aliases: ["ada", "lovelace"],
  },
  {
    id: "a10g",
    name: "A10G",
    vendor: "NVIDIA",
    memory: "24 GB",
    tier: "inference",
    scarcity: 0.09,
    basePrice: 0.6,
    aliases: ["ampere"],
  },
  {
    id: "t4",
    name: "T4",
    vendor: "NVIDIA",
    memory: "16 GB",
    tier: "inference",
    scarcity: 0.04,
    basePrice: 0.32,
    aliases: ["turing"],
  },
  // NVIDIA — workstation / prosumer
  {
    id: "rtx6000-ada",
    name: "RTX 6000 Ada",
    vendor: "NVIDIA",
    memory: "48 GB",
    tier: "workstation",
    scarcity: 0.18,
    basePrice: 1.1,
    aliases: ["ada", "lovelace", "quadro"],
  },
  {
    id: "rtx5090",
    name: "RTX 5090",
    vendor: "NVIDIA",
    memory: "32 GB",
    tier: "workstation",
    scarcity: 0.35,
    basePrice: 0.95,
    aliases: ["blackwell", "geforce"],
  },
  {
    id: "rtx4090",
    name: "RTX 4090",
    vendor: "NVIDIA",
    memory: "24 GB",
    tier: "workstation",
    scarcity: 0.2,
    basePrice: 0.58,
    aliases: ["ada", "lovelace", "geforce"],
  },
  // AMD
  {
    id: "mi355x",
    name: "MI355X",
    vendor: "AMD",
    memory: "288 GB",
    tier: "flagship",
    scarcity: 0.72,
    basePrice: 7.4,
    aliases: ["instinct", "cdna"],
  },
  {
    id: "mi300x",
    name: "MI300X",
    vendor: "AMD",
    memory: "192 GB",
    tier: "current",
    scarcity: 0.4,
    basePrice: 3.2,
    aliases: ["instinct", "cdna"],
    featured: true,
  },
  {
    id: "mi250x",
    name: "MI250X",
    vendor: "AMD",
    memory: "128 GB",
    tier: "previous",
    scarcity: 0.15,
    basePrice: 1.45,
    aliases: ["instinct", "cdna"],
  },
  // Other accelerators
  {
    id: "tpu-v6e",
    name: "TPU v6e",
    vendor: "Google",
    memory: "32 GB",
    tier: "current",
    scarcity: 0.55,
    basePrice: 2.7,
    aliases: ["trillium", "tensor"],
  },
  {
    id: "gaudi3",
    name: "Gaudi 3",
    vendor: "Intel",
    memory: "128 GB",
    tier: "current",
    scarcity: 0.48,
    basePrice: 2.4,
    aliases: ["habana"],
  },
];

/** The short list shown before the user searches. */
export const FEATURED_GPUS: Gpu[] = GPUS.filter((gpu) => gpu.featured);

/**
 * Initial selection. H100 rather than the newest flagship: it's the most
 * widely stocked part, so the first paint shows a real spread of levels
 * instead of "low" across the board.
 */
export const DEFAULT_GPU: Gpu =
  FEATURED_GPUS.find((gpu) => gpu.id === "h100") ?? FEATURED_GPUS[0] ?? GPUS[0];

/** Case-insensitive match over name, vendor, memory and aliases. */
export function searchGpus(query: string, gpus: Gpu[] = GPUS): Gpu[] {
  const q = query.trim().toLowerCase();
  if (!q) return gpus;
  const terms = q.split(/\s+/);
  return gpus.filter((gpu) => {
    const haystack = [gpu.name, gpu.vendor, gpu.memory, gpu.tier, ...(gpu.aliases ?? [])]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export type Availability = {
  providerId: string;
  /**
   * How readily this GPU can be scheduled, 0 (none) to 1 (plentiful).
   * Providers don't expose absolute node counts, so availability is only
   * ever a level — never a number of GPUs.
   */
  level: number;
  /**
   * USD per GPU-hour. Omitted for capacity you run yourself: what it costs
   * you is your own amortised hardware, not a rate v-sigma can quote.
   */
  pricePerHour?: number;
  /**
   * Round-trip response time from v-sigma to the provider's API, in ms.
   * Omitted for capacity you run yourself — there is no third-party API hop
   * to time, so any figure would be invented.
   */
  responseMs?: number;
};

export type AvailabilityStatus = "healthy" | "tight" | "scarce" | "none";

export function levelStatus(level: number): AvailabilityStatus {
  if (level <= 0.02) return "none";
  if (level >= 0.5) return "healthy";
  if (level >= 0.15) return "tight";
  return "scarce";
}

export function availabilityStatus(a: Availability): AvailabilityStatus {
  return levelStatus(a.level);
}

/**
 * Availability of a whole group, as the mean of its members' levels. A mean
 * rather than the best member: one well-stocked vendor shouldn't make the
 * group read as plentiful when the rest are dry.
 *
 * The thresholds are lower than `levelStatus`'s because averaging several
 * providers pulls toward the middle — reusing the per-provider cut-offs would
 * paint nearly every group amber and the colour would carry no signal.
 */
export function groupStatus(rows: Availability[]): AvailabilityStatus {
  if (rows.length === 0) return "none";
  const mean = rows.reduce((sum, row) => sum + row.level, 0) / rows.length;
  if (mean <= 0.02) return "none";
  if (mean >= 0.45) return "healthy";
  if (mean >= 0.3) return "tight";
  return "scarce";
}
