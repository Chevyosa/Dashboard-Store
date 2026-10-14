export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.API_URL || "http://localhost:5050";
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("X-Requested-With", "XMLHttpRequest");

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (typeof body === "string") {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: serializedBody,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "object" &&
      (data as { error: unknown }).error !== null
    ) {
      const err = (
        data as {
          error: {
            code?: string;
            message?: string;
            details?: ApiErrorDetail[];
          };
        }
      ).error;
      throw new ApiError(
        response.status,
        err.code || "UNKNOWN_ERROR",
        err.message || "Terjadi kesalahan pada server.",
        err.details || [],
      );
    }

    throw new ApiError(
      response.status,
      "HTTP_ERROR",
      `Permintaan gagal dengan status ${response.status}.`,
    );
  }

  return data as T;
}

export interface Consignor {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  defaultMarginType: "nominal" | "percent" | null;
  defaultMarginValue: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListConsignorsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ConsignorListResponse {
  data: Consignor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateConsignorPayload {
  name: string;
  phone?: string | null;
  note?: string | null;
  defaultMarginType?: "nominal" | "percent" | null;
  defaultMarginValue?: string | null;
}

export interface UpdateConsignorPayload {
  name?: string;
  phone?: string | null;
  note?: string | null;
  defaultMarginType?: "nominal" | "percent" | null;
  defaultMarginValue?: string | null;
}

export async function getConsignors(
  params: ListConsignorsParams = {},
): Promise<ConsignorListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.search !== undefined && params.search.trim() !== "") {
    searchParams.set("search", params.search.trim());
  }
  if (params.status !== undefined) searchParams.set("status", params.status);
  if (params.sortBy !== undefined) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder !== undefined) searchParams.set("sortOrder", params.sortOrder);

  const qs = searchParams.toString();
  return apiFetch<ConsignorListResponse>(
    `/api/v1/consignors${qs ? `?${qs}` : ""}`,
  );
}

export async function getConsignor(id: number): Promise<{ data: Consignor }> {
  return apiFetch<{ data: Consignor }>(`/api/v1/consignors/${id}`);
}

export async function createConsignor(
  payload: CreateConsignorPayload,
): Promise<{ data: Consignor }> {
  return apiFetch<{ data: Consignor }>("/api/v1/consignors", {
    method: "POST",
    body: payload,
  });
}

export async function updateConsignor(
  id: number,
  payload: UpdateConsignorPayload,
): Promise<{ data: Consignor }> {
  return apiFetch<{ data: Consignor }>(`/api/v1/consignors/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function setConsignorStatus(
  id: number,
  isActive: boolean,
): Promise<{ data: Consignor }> {
  return apiFetch<{ data: Consignor }>(`/api/v1/consignors/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}

export interface ProductMarginInfo {
  ownerMarginPerPcs: string | null;
  ownerMarginPerPack: string | null;
  consignorSharePerPcs: string | null;
  consignorSharePerPack: string | null;
}

export interface Product {
  id: number;
  name: string;
  ownerType: "own" | "consignor";
  consignorId: number | null;
  consignorName: string | null;
  pcsPerPack: number;
  sellPrice: string;
  marginType: "nominal" | "percent" | null;
  marginValue: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  marginInfo: ProductMarginInfo;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  ownerType?: "own" | "consignor";
  consignorId?: number;
  isActive?: "true" | "false" | "all";
  sortBy?: "name" | "ownerType" | "sellPrice" | "isActive" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProductPayload {
  name: string;
  ownerType: "own" | "consignor";
  consignorId?: number | null;
  pcsPerPack: number;
  sellPrice: string;
  marginType?: "nominal" | "percent" | null;
  marginValue?: string | null;
}

export type UpdateProductPayload = CreateProductPayload;

export interface PreviewMarginPayload {
  ownerType: "own" | "consignor";
  pcsPerPack: number;
  sellPrice: string;
  marginType?: "nominal" | "percent";
  marginValue?: string;
  avgCost?: string;
}

export async function getProducts(
  params: ListProductsParams = {},
): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.search !== undefined && params.search.trim() !== "") {
    searchParams.set("search", params.search.trim());
  }
  if (params.ownerType !== undefined) searchParams.set("ownerType", params.ownerType);
  if (params.consignorId !== undefined) searchParams.set("consignorId", String(params.consignorId));
  if (params.isActive !== undefined) searchParams.set("isActive", params.isActive);
  if (params.sortBy !== undefined) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder !== undefined) searchParams.set("sortOrder", params.sortOrder);

  const qs = searchParams.toString();
  return apiFetch<ProductListResponse>(`/api/v1/products${qs ? `?${qs}` : ""}`);
}

export async function getProduct(id: number): Promise<{ data: Product }> {
  return apiFetch<{ data: Product }>(`/api/v1/products/${id}`);
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<{ data: Product }> {
  return apiFetch<{ data: Product }>("/api/v1/products", {
    method: "POST",
    body: payload,
  });
}

export async function updateProduct(
  id: number,
  payload: UpdateProductPayload,
): Promise<{ data: Product }> {
  return apiFetch<{ data: Product }>(`/api/v1/products/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function setProductStatus(
  id: number,
  isActive: boolean,
): Promise<{ data: Product }> {
  return apiFetch<{ data: Product }>(`/api/v1/products/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}

export async function previewProductMargin(
  payload: PreviewMarginPayload,
): Promise<{ data: ProductMarginInfo }> {
  return apiFetch<{ data: ProductMarginInfo }>("/api/v1/products/preview", {
    method: "POST",
    body: payload,
  });
}

// === STOCK IN & STOCK RETURN ===

export interface StockInLine {
  id: number;
  stockInId: number;
  productId: number;
  productName: string;
  ownerType: "own" | "consignor";
  consignorName: string | null;
  inputMode: "pack" | "pcs";
  qtyPack: number | null;
  pcsPerPackSnapshot: number;
  qtyPcs: number;
  totalCost: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockIn {
  id: number;
  type: "purchase" | "consignment_in" | "initial";
  date: string;
  note: string | null;
  opnameId: number | null;
  totalCost: string;
  totalQtyPcs: number;
  linesCount: number;
  lines?: StockInLine[];
  createdAt: string;
  updatedAt: string;
}

export interface StockReturn {
  id: number;
  productId: number;
  productName: string;
  consignorId: number | null;
  consignorName: string | null;
  qtyPcs: number;
  date: string;
  note: string | null;
  opnameId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockInSummary {
  totalPurchaseCost: string;
  totalLines: number;
  totalOwnPcs: number;
  totalConsignorPcs: number;
  totalTransactions: number;
  openReturnsCount: number;
  openReturnedPcs: number;
}

export interface StockInLinePayload {
  productId: number;
  inputMode: "pack" | "pcs";
  qtyPack?: number | null;
  qtyPcs?: number | null;
  totalCost: string;
}

export interface CreateStockInPayload {
  type: "purchase" | "consignment_in" | "initial";
  date: string;
  note?: string | null;
  lines: StockInLinePayload[];
}

export interface UpdateStockInPayload {
  date?: string;
  note?: string | null;
  lines?: StockInLinePayload[];
}

export interface ListStockInsParams {
  page?: number;
  limit?: number;
  type?: "purchase" | "consignment_in" | "initial";
  period?: "open" | "closed" | "all";
  startDate?: string;
  endDate?: string;
}

export interface StockInListResponse {
  data: StockIn[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateStockReturnPayload {
  productId: number;
  qtyPcs: number;
  date: string;
  note?: string | null;
}

export interface UpdateStockReturnPayload {
  qtyPcs?: number;
  date?: string;
  note?: string | null;
}

export interface ListStockReturnsParams {
  page?: number;
  limit?: number;
  productId?: number;
  consignorId?: number;
  period?: "open" | "closed" | "all";
  startDate?: string;
  endDate?: string;
}

export interface StockReturnListResponse {
  data: StockReturn[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getStockIns(
  params: ListStockInsParams = {},
): Promise<StockInListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.type !== undefined) searchParams.set("type", params.type);
  if (params.period !== undefined) searchParams.set("period", params.period);
  if (params.startDate !== undefined) searchParams.set("startDate", params.startDate);
  if (params.endDate !== undefined) searchParams.set("endDate", params.endDate);

  const qs = searchParams.toString();
  return apiFetch<StockInListResponse>(`/api/v1/stock-ins${qs ? `?${qs}` : ""}`);
}

export async function getStockIn(id: number): Promise<{ data: StockIn }> {
  return apiFetch<{ data: StockIn }>(`/api/v1/stock-ins/${id}`);
}

export async function createStockIn(
  payload: CreateStockInPayload,
): Promise<{ data: StockIn }> {
  return apiFetch<{ data: StockIn }>("/api/v1/stock-ins", {
    method: "POST",
    body: payload,
  });
}

export async function updateStockIn(
  id: number,
  payload: UpdateStockInPayload,
): Promise<{ data: StockIn }> {
  return apiFetch<{ data: StockIn }>(`/api/v1/stock-ins/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteStockIn(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/stock-ins/${id}`, {
    method: "DELETE",
  });
}

export async function getOpenPeriodStockInSummary(): Promise<{ data: StockInSummary }> {
  return apiFetch<{ data: StockInSummary }>("/api/v1/stock-ins/summary/open-period");
}

export async function getStockReturns(
  params: ListStockReturnsParams = {},
): Promise<StockReturnListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.productId !== undefined) searchParams.set("productId", String(params.productId));
  if (params.consignorId !== undefined) searchParams.set("consignorId", String(params.consignorId));
  if (params.period !== undefined) searchParams.set("period", params.period);
  if (params.startDate !== undefined) searchParams.set("startDate", params.startDate);
  if (params.endDate !== undefined) searchParams.set("endDate", params.endDate);

  const qs = searchParams.toString();
  return apiFetch<StockReturnListResponse>(`/api/v1/stock-returns${qs ? `?${qs}` : ""}`);
}

export async function getStockReturn(id: number): Promise<{ data: StockReturn }> {
  return apiFetch<{ data: StockReturn }>(`/api/v1/stock-returns/${id}`);
}

export async function createStockReturn(
  payload: CreateStockReturnPayload,
): Promise<{ data: StockReturn }> {
  return apiFetch<{ data: StockReturn }>("/api/v1/stock-returns", {
    method: "POST",
    body: payload,
  });
}

export async function updateStockReturn(
  id: number,
  payload: UpdateStockReturnPayload,
): Promise<{ data: StockReturn }> {
  return apiFetch<{ data: StockReturn }>(`/api/v1/stock-returns/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteStockReturn(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/stock-returns/${id}`, {
    method: "DELETE",
  });
}

// === LOSS (BARANG RUSAK & HILANG) ===

export type LossReason =
  | 'expired'
  | 'damaged_on_display'
  | 'damaged_before_display'
  | 'lost'
  | 'other';

export type LossBorneBy = 'owner' | 'consignor';

export interface LossRecord {
  id: number;
  productId: number;
  productName: string;
  ownerType: 'own' | 'consignor';
  consignorId: number | null;
  consignorName: string | null;
  sellPrice: string;
  marginType: 'nominal' | 'percent' | null;
  marginValue: string | null;
  qtyPcs: number;
  reason: LossReason;
  borneBy: LossBorneBy;
  date: string;
  note: string | null;
  opnameId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLossPayload {
  productId: number;
  qtyPcs: number;
  reason: LossReason;
  borneBy?: LossBorneBy;
  date: string;
  note?: string | null;
}

export interface UpdateLossPayload {
  productId?: number;
  qtyPcs?: number;
  reason?: LossReason;
  borneBy?: LossBorneBy;
  date?: string;
  note?: string | null;
}

export interface ListLossesParams {
  page?: number;
  limit?: number;
  period?: 'open' | 'closed' | 'all';
  reason?: LossReason;
  borneBy?: LossBorneBy;
  productId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'id' | 'qty_pcs' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface LossSummary {
  totalPcs: number;
  totalRecords: number;
  totalOwnerBornePcs: number;
  totalConsignorBornePcs: number;
  breakdownByReason: Record<LossReason, number>;
}

export interface LossListResponse {
  data: LossRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getLosses(
  params: ListLossesParams = {},
): Promise<LossListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.period !== undefined) searchParams.set('period', params.period);
  if (params.reason !== undefined) searchParams.set('reason', params.reason);
  if (params.borneBy !== undefined) searchParams.set('borneBy', params.borneBy);
  if (params.productId !== undefined) searchParams.set('productId', String(params.productId));
  if (params.startDate !== undefined) searchParams.set('startDate', params.startDate);
  if (params.endDate !== undefined) searchParams.set('endDate', params.endDate);
  if (params.sortBy !== undefined) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder !== undefined) searchParams.set('sortOrder', params.sortOrder);

  const qs = searchParams.toString();
  return apiFetch<LossListResponse>(`/api/v1/losses${qs ? `?${qs}` : ''}`);
}

export async function getLoss(id: number): Promise<{ data: LossRecord }> {
  return apiFetch<{ data: LossRecord }>(`/api/v1/losses/${id}`);
}

export async function createLoss(
  payload: CreateLossPayload,
): Promise<{ data: LossRecord }> {
  return apiFetch<{ data: LossRecord }>('/api/v1/losses', {
    method: 'POST',
    body: payload,
  });
}

export async function updateLoss(
  id: number,
  payload: UpdateLossPayload,
): Promise<{ data: LossRecord }> {
  return apiFetch<{ data: LossRecord }>(`/api/v1/losses/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteLoss(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/losses/${id}`, {
    method: 'DELETE',
  });
}

export async function getOpenPeriodLossSummary(): Promise<{ data: LossSummary }> {
  return apiFetch<{ data: LossSummary }>('/api/v1/losses/summary/open-period');
}

// ---------------------------------------------------------------------------
// OPNAME (T-10)
// ---------------------------------------------------------------------------

export interface PhysicalItemInput {
  productId: number;
  physicalQty: number;
}

export interface OpnameItem {
  id?: number;
  opnameId?: number;
  productId: number;
  ownerType: 'own' | 'consignor';
  consignorId: number | null;
  productNameSnapshot: string;
  sellPriceSnapshot: string;
  marginTypeSnapshot: 'nominal' | 'percent' | null;
  marginValueSnapshot: string | null;
  pcsPerPackSnapshot: number;
  openingQty: number;
  openingValue: string;
  inQty: number;
  inCost: string;
  returnedQty: number;
  expectedQty: number;
  physicalQty: number;
  diffQty: number;
  lossQty: number;
  soldQty: number;
  avgCost: string;
  cogs: string;
  ownLossCost: string;
  closingValue: string;
  turnover: string;
  ownerMarginPerPcs: string;
  consignorSharePerPcs: string;
  soldShare: string;
  lossQtyOwnerBorne: number;
  lossCompensation: string;
  payoutDue: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpnameConsignorPayout {
  id?: number;
  opnameId?: number;
  consignorId: number;
  consignorName?: string;
  soldShare: string;
  lossCompensation: string;
  payoutDue: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpnameRecord {
  id: number;
  opnameDate: string;
  status: 'draft' | 'final';
  note: string | null;
  totalTurnover: string;
  totalSoldQty: number;
  totalLossQty: number;
  totalCogs: string;
  totalPayoutDue: string;
  createdAt: string;
  updatedAt: string;
  items?: OpnameItem[];
  payouts?: OpnameConsignorPayout[];
}

export interface PreparedSheetProduct {
  productId: number;
  productName: string;
  ownerType: 'own' | 'consignor';
  consignorId: number | null;
  consignorName: string | null;
  pcsPerPack: number;
  sellPrice: string;
  marginType: 'nominal' | 'percent' | null;
  marginValue: string | null;
  openingQty: number;
  openingValue: string;
  inQty: number;
  inCost: string;
  returnedQty: number;
  expectedQty: number;
  lossQty: number;
  losses: { qty: number; reason: LossReason; borneBy: LossBorneBy; note?: string }[];
  draftPhysicalQty: number | null;
}

export interface OpnamePrepareSheet {
  opnameDate: string;
  existingOpname: OpnameRecord | null;
  products: PreparedSheetProduct[];
}

export interface CalculateOpnameResponse {
  data: {
    calculatedItems: OpnameItem[];
    calculatedPayouts: {
      consignorId: number;
      soldShare: string;
      lossCompensation: string;
      payoutDue: string;
    }[];
    totals: {
      totalTurnover: string;
      totalSoldQty: number;
      totalLossQty: number;
      totalCogs: string;
      totalPayoutDue: string;
    };
  };
}

export interface ListOpnamesParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'final' | 'all';
  startDate?: string;
  endDate?: string;
  sortBy?: 'opname_date' | 'id' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface OpnameListResponse {
  data: OpnameRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function prepareOpname(date: string): Promise<{ data: OpnamePrepareSheet }> {
  return apiFetch<{ data: OpnamePrepareSheet }>(`/api/v1/opnames/prepare?date=${encodeURIComponent(date)}`);
}

export async function calculateOpname(payload: {
  opnameDate: string;
  items: PhysicalItemInput[];
}): Promise<CalculateOpnameResponse> {
  return apiFetch<CalculateOpnameResponse>('/api/v1/opnames/calculate', {
    method: 'POST',
    body: payload,
  });
}

export async function saveDraftOpname(payload: {
  opnameDate: string;
  note?: string | null;
  items: PhysicalItemInput[];
}): Promise<{ data: OpnameRecord }> {
  return apiFetch<{ data: OpnameRecord }>('/api/v1/opnames/draft', {
    method: 'POST',
    body: payload,
  });
}

export async function finalizeOpname(payload: {
  opnameDate: string;
  note?: string | null;
  items: PhysicalItemInput[];
}): Promise<{ data: OpnameRecord }> {
  return apiFetch<{ data: OpnameRecord }>('/api/v1/opnames/finalize', {
    method: 'POST',
    body: payload,
  });
}

export async function getOpnames(params: ListOpnamesParams = {}): Promise<OpnameListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.status !== undefined) searchParams.set('status', params.status);
  if (params.startDate !== undefined) searchParams.set('startDate', params.startDate);
  if (params.endDate !== undefined) searchParams.set('endDate', params.endDate);
  if (params.sortBy !== undefined) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder !== undefined) searchParams.set('sortOrder', params.sortOrder);

  const qs = searchParams.toString();
  return apiFetch<OpnameListResponse>(`/api/v1/opnames${qs ? `?${qs}` : ''}`);
}

export async function getOpname(id: number): Promise<{ data: OpnameRecord }> {
  return apiFetch<{ data: OpnameRecord }>(`/api/v1/opnames/${id}`);
}

export async function deleteDraftOpname(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/opnames/${id}/draft`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// PAYOUT & CONSIGNOR LEDGER (T-11)
// ---------------------------------------------------------------------------

export type ConsignorLedgerStatus = 'unpaid' | 'settled' | 'overpaid';

export interface ConsignorLedgerItem {
  consignorId: number;
  consignorName: string;
  phone: string | null;
  isActive: boolean;
  totalAccrual: string;
  totalPayment: string;
  balance: string;
  status: ConsignorLedgerStatus;
}

export interface ConsignorLedgersOverview {
  totals: {
    totalAccrual: string;
    totalPayment: string;
    totalBalance: string;
    unpaidCount: number;
  };
  ledgers: ConsignorLedgerItem[];
}

export interface ConsignorAccrual {
  id: number;
  opnameId: number;
  opnameDate: string;
  consignorId: number;
  soldShare: string;
  lossCompensation: string;
  payoutDue: string;
  createdAt: string;
}

export interface ConsignorPayment {
  id: number;
  consignorId: number;
  consignorName: string;
  opnameId: number | null;
  opnameDate: string | null;
  amount: string;
  paymentDate: string;
  paymentMethod: 'cash' | 'transfer' | 'qris';
  note: string | null;
  createdBy: number | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsignorLedgerDetail {
  consignor: {
    id: number;
    name: string;
    phone: string | null;
    note: string | null;
    isActive: boolean;
  };
  summary: {
    totalAccrual: string;
    totalPayment: string;
    balance: string;
    status: ConsignorLedgerStatus;
  };
  accruals: ConsignorAccrual[];
  payments: ConsignorPayment[];
}

export interface CreatePaymentPayload {
  consignorId: number;
  opnameId?: number | null;
  amount: string;
  paymentDate: string;
  paymentMethod: 'cash' | 'transfer' | 'qris';
  note?: string | null;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  consignorId?: number;
  opnameId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaymentListResponse {
  data: ConsignorPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getConsignorLedgers(params: {
  status?: string;
  search?: string;
} = {}): Promise<{ data: ConsignorLedgersOverview }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  return apiFetch<{ data: ConsignorLedgersOverview }>(`/api/v1/payouts/ledgers${qs ? `?${qs}` : ''}`);
}

export async function getConsignorLedger(consignorId: number): Promise<{ data: ConsignorLedgerDetail }> {
  return apiFetch<{ data: ConsignorLedgerDetail }>(`/api/v1/payouts/ledgers/${consignorId}`);
}

export async function getConsignorPayments(params: ListPaymentsParams = {}): Promise<PaymentListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.consignorId !== undefined) searchParams.set('consignorId', String(params.consignorId));
  if (params.opnameId !== undefined) searchParams.set('opnameId', String(params.opnameId));
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  const qs = searchParams.toString();
  return apiFetch<PaymentListResponse>(`/api/v1/payouts/payments${qs ? `?${qs}` : ''}`);
}

export async function createConsignorPayment(payload: CreatePaymentPayload): Promise<{ data: ConsignorPayment }> {
  return apiFetch<{ data: ConsignorPayment }>('/api/v1/payouts/payments', {
    method: 'POST',
    body: payload,
  });
}

export async function deleteConsignorPayment(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/v1/payouts/payments/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// Dashboard & Cash Reconciliation Types & API
// ==========================================

export interface DashboardOverview {
  activeProductsCount: number;
  activeConsignorsCount: number;
  totalStockValuation: string;
  totalUnpaidConsignorBalance: string;
  latestOpname: {
    id: number;
    opnameDate: string;
    status: 'draft' | 'final';
    totalTurnover: string;
    totalSoldQty: number;
    totalLossQty: number;
    totalCogs: string;
    totalPayoutDue: string;
  } | null;
  hasActiveDraft: boolean;
  activeDraftDate: string | null;
}

export interface DashboardTurnoverBreakdown {
  ownTurnover: string;
  consignorTurnover: string;
  totalTurnover: string;
  ownPercentage: number;
  consignorPercentage: number;
}

export interface DashboardTopProduct {
  productId: number;
  name: string;
  ownerType: 'own' | 'consignor';
  soldQty: number;
  turnover: string;
}

export interface DashboardPendingPayout {
  consignorId: number;
  consignorName: string;
  phone: string | null;
  totalAccrual: string;
  totalPayment: string;
  balance: string;
}

export interface DashboardRecentOpname {
  id: number;
  opnameDate: string;
  status: 'draft' | 'final';
  totalTurnover: string;
  totalSoldQty: number;
  totalLossQty: number;
  totalCogs: string;
  totalPayoutDue: string;
}

export interface DashboardOpnameOption {
  id: number;
  opnameDate: string;
  status: 'draft' | 'final';
}

export interface DashboardReconciliationResult {
  opnameId: number;
  opnameDate: string;
  theoreticalTurnover: string;
  turnoverOwn: string;
  turnoverConsignor: string;
  qrisAmount: string;
  cashAmount: string;
  realCash: string;
  cashDifference: string;
  cashDifferenceHint: string;
  totalCogs: string;
  totalOwnLossCost: string;
  totalLossCompensation: string;
  totalOpeningValue: string;
  totalClosingValue: string;
  modalBelanjaOwn: string;
  totalPayoutDue: string;
  profitA: string;
  profitB: string;
  profitDiff: string;
  invariantI3Satisfied: boolean;
}

export interface DashboardSummaryResponse {
  overview: DashboardOverview;
  turnoverBreakdown: DashboardTurnoverBreakdown;
  topProducts: DashboardTopProduct[];
  pendingPayoutConsignors: DashboardPendingPayout[];
  recentOpnames: DashboardRecentOpname[];
  opnameOptions: DashboardOpnameOption[];
  latestReconciliation: DashboardReconciliationResult | null;
}

export interface CalculateReconciliationPayload {
  opnameId?: number;
  cashAmount: string;
  qrisAmount: string;
  modalBelanjaOwn?: string;
}

export async function getDashboardSummary(): Promise<{ data: DashboardSummaryResponse }> {
  return apiFetch<{ data: DashboardSummaryResponse }>('/api/v1/dashboard/summary');
}

export async function calculateDashboardReconciliation(
  payload: CalculateReconciliationPayload,
): Promise<{ data: DashboardReconciliationResult }> {
  return apiFetch<{ data: DashboardReconciliationResult }>('/api/v1/dashboard/reconciliation', {
    method: 'POST',
    body: payload,
  });
}

// ==========================================
// Audit Trail Types & API
// ==========================================

export interface AuditLogItem {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  before: unknown | null;
  after: unknown | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditFilterOptionsResponse {
  data: {
    actions: string[];
    entityTypes: string[];
  };
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function getAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLogsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.action) searchParams.set('action', params.action);
  if (params.entityType) searchParams.set('entityType', params.entityType);
  if (params.entityId) searchParams.set('entityId', params.entityId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  return apiFetch<AuditLogsResponse>(`/api/v1/audit-logs${qs ? `?${qs}` : ''}`);
}

export async function getAuditLogFilters(): Promise<AuditFilterOptionsResponse> {
  return apiFetch<AuditFilterOptionsResponse>('/api/v1/audit-logs/filters');
}

export async function getAuditLogDetail(id: number): Promise<{ data: AuditLogItem }> {
  return apiFetch<{ data: AuditLogItem }>(`/api/v1/audit-logs/${id}`);
}






