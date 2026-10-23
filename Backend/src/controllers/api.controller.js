import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  Customer,
  SubscriptionPlan,
  Subscription,
  UsageRecord,
  SubscriptionEvent,
} from "../models/index.js";

const collections = {
  customers: Customer,
  plans: SubscriptionPlan,
  subscriptions: Subscription,
  usage: UsageRecord,
};
const send = (res, data, message = "Success", status = 200) =>
  res.status(status).json(new ApiResponse(status, data, message));
const safeFields = {
  customers: ["name", "email", "company", "status"],
  plans: [
    "name",
    "description",
    "billingInterval",
    "price",
    "currency",
    "features",
    "active",
  ],
  subscriptions: [
    "customer",
    "plan",
    "startDate",
    "currentPeriodStart",
    "currentPeriodEnd",
    "cancellationEffectiveDate",
    "cancellationReason",
    "autoRenew",
  ],
  usage: [
    "customer",
    "subscription",
    "activityType",
    "quantity",
    "eventAt",
    "metadata",
  ],
};
const pick = (body, fields) =>
  Object.fromEntries(
    fields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, body[field]]),
  );
const populate = {
  subscriptions: "customer plan",
  usage: "customer subscription",
};
const list = (type) =>
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20),
    );
    const filter = {};
    if (req.query.status && ["customers", "subscriptions"].includes(type))
      filter.status = req.query.status;
    if (req.query.active && type === "plans")
      filter.active = req.query.active === "true";
    if (req.query.customer && ["subscriptions", "usage"].includes(type))
      filter.customer = req.query.customer;
    if (req.query.plan && type === "subscriptions")
      filter.plan = req.query.plan;
    if (req.query.subscription && type === "usage")
      filter.subscription = req.query.subscription;
    if (req.query.search && ["customers", "plans"].includes(type)) {
      const search = String(req.query.search)
        .slice(0, 80)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = (
        type === "customers"
          ? ["name", "email", "company"]
          : ["name", "description"]
      ).map((key) => ({ [key]: { $regex: search, $options: "i" } }));
    }
    if (req.query.from || req.query.to) {
      const key = type === "usage" ? "eventAt" : "startDate";
      filter[key] = {};
      if (req.query.from) filter[key].$gte = new Date(req.query.from);
      if (req.query.to) filter[key].$lte = new Date(req.query.to);
    }
    const Model = collections[type];
    let query = Model.find(filter);
    if (populate[type]) query = query.populate(populate[type]);
    const [items, total] = await Promise.all([
      query
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Model.countDocuments(filter),
    ]);
    return send(res, {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  });
const create = (type) =>
  asyncHandler(async (req, res) => {
    const payload = pick(req.body, safeFields[type]);
    if (type === "subscriptions") {
      const [customer, plan] = await Promise.all([
        Customer.exists({ _id: payload.customer }),
        SubscriptionPlan.exists({ _id: payload.plan, active: true }),
      ]);
      if (!customer || !plan)
        throw new ApiError(
          400,
          "Subscription requires an existing customer and active plan",
        );
    }
    if (type === "usage") {
      const [customer, subscription] = await Promise.all([
        Customer.exists({ _id: payload.customer }),
        Subscription.findById(payload.subscription),
      ]);
      if (
        !customer ||
        !subscription ||
        String(subscription.customer) !== String(payload.customer)
      )
        throw new ApiError(
          400,
          "Usage requires a matching customer and subscription",
        );
    }
    const item = await collections[type].create(payload);
    return send(res, item, "Created", 201);
  });
const get = (type) =>
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      throw new ApiError(400, "Invalid resource id");
    let query = collections[type].findById(req.params.id);
    if (populate[type]) query = query.populate(populate[type]);
    const item = await query;
    if (!item) throw new ApiError(404, "Resource not found");
    return send(res, item);
  });
const update = (type) =>
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      throw new ApiError(400, "Invalid resource id");
    let query = collections[type].findByIdAndUpdate(
      req.params.id,
      { $set: pick(req.body, safeFields[type]) },
      { new: true, runValidators: true },
    );
    if (populate[type]) query = query.populate(populate[type]);
    const item = await query;
    if (!item) throw new ApiError(404, "Resource not found");
    return send(res, item, "Updated");
  });
const removeCustomer = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid resource id");
  if (await Subscription.exists({ customer: req.params.id }))
    throw new ApiError(
      409,
      "Customer has subscription history and cannot be deleted",
    );
  const item = await Customer.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Customer not found");
  return send(res, null, "Deleted");
});
export const controllers = { list, create, get, update, removeCustomer };
export const cancelSubscription = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new ApiError(400, "Invalid subscription id");
  const item = await Subscription.findById(req.params.id);
  if (!item) throw new ApiError(404, "Subscription not found");
  if (item.status === "cancelled")
    return send(res, item, "Subscription is already cancelled");
  if (!["active", "trial", "past_due"].includes(item.status))
    throw new ApiError(
      409,
      "This subscription cannot be cancelled from its current status",
    );
  const previousStatus = item.status;
  item.status = "cancelled";
  item.cancellationDate = new Date();
  item.cancellationEffectiveDate = req.body.effectiveDate
    ? new Date(req.body.effectiveDate)
    : item.cancellationDate;
  item.cancellationReason = String(req.body.reason || "").slice(0, 500);
  item.autoRenew = false;
  await item.save();
  await SubscriptionEvent.create({
    subscription: item._id,
    type: "cancelled",
    previousStatus,
    newStatus: "cancelled",
    occurredAt: item.cancellationDate,
    reason: item.cancellationReason,
  });
  return send(res, item, "Subscription cancelled");
});
export const analytics = asyncHandler(async (_req, res) => {
  const [customers, subscriptions, usage, plans, events] = await Promise.all([
    Customer.countDocuments(),
    Subscription.find().populate("plan"),
    UsageRecord.find(),
    SubscriptionPlan.find(),
    SubscriptionEvent.find(),
  ]);
  const eligible = subscriptions.filter(
    (s) =>
      ["active", "past_due"].includes(s.status) && s.plan && s.plan.price > 0,
  );
  const mrr = eligible.reduce(
    (sum, s) =>
      sum +
      (s.plan.billingInterval === "yearly" ? s.plan.price / 12 : s.plan.price),
    0,
  );
  const active = subscriptions.filter((s) =>
    ["active", "past_due"].includes(s.status),
  ).length;
  const cancelled = subscriptions.filter(
    (s) => s.status === "cancelled",
  ).length;
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const cancellationsThisMonth = events.filter(
    (e) => e.type === "cancelled" && e.occurredAt >= since,
  ).length;
  return send(res, {
    totalCustomers: customers,
    activeSubscriptions: active,
    cancelledSubscriptions: cancellationsThisMonth,
    cancellationRate: subscriptions.length
      ? cancellationsThisMonth / subscriptions.length
      : 0,
    estimatedMrr: Number(mrr.toFixed(2)),
    averageRevenuePerActiveSubscription: active
      ? Number((mrr / active).toFixed(2))
      : 0,
    totalUsageEvents: usage.length,
    averageUsagePerActiveSubscription: active
      ? Number(
          (usage.reduce((sum, u) => sum + u.quantity, 0) / active).toFixed(2),
        )
      : 0,
    subscriptionsByStatus: [
      "trial",
      "active",
      "past_due",
      "cancelled",
      "expired",
    ].map((status) => ({
      status,
      count: subscriptions.filter((s) => s.status === status).length,
    })),
    plans: plans.map((p) => ({
      name: p.name,
      interval: p.billingInterval,
      active: p.active,
    })),
    recentCancellations: events.filter((e) => e.type === "cancelled").length,
  });
});
export const cancelPlan = asyncHandler(async (req, res) => {
  const item = await SubscriptionPlan.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true },
  );
  if (!item) throw new ApiError(404, "Plan not found");
  return send(res, item, "Plan deactivated");
});
export const csvExport = asyncHandler(async (req, res) => {
  const type = req.params.dataset;
  const Model = type === "events" ? SubscriptionEvent : collections[type];
  if (!Model) throw new ApiError(404, "Unknown dataset");
  const dateField = {
    customers: "createdAt",
    subscriptions: "startDate",
    usage: "eventAt",
    events: "occurredAt",
  }[type];
  const filter = {};
  if (dateField && (req.query.from || req.query.to)) {
    filter[dateField] = {};
    if (req.query.from) {
      const from = new Date(req.query.from);
      if (Number.isNaN(from.getTime()))
        throw new ApiError(400, "Invalid from date");
      filter[dateField].$gte = from;
    }
    if (req.query.to) {
      const to = new Date(req.query.to);
      if (Number.isNaN(to.getTime()))
        throw new ApiError(400, "Invalid to date");
      filter[dateField].$lte = to;
    }
    if (
      filter[dateField].$gte &&
      filter[dateField].$lte &&
      filter[dateField].$gte > filter[dateField].$lte
    )
      throw new ApiError(400, "from must be before to");
  }
  let query = Model.find(filter);
  if (populate[type]) query = query.populate(populate[type]);
  const rows = await query.lean();
  const cols =
    type === "customers"
      ? ["_id", "name", "email", "company", "status", "createdAt"]
      : type === "plans"
        ? ["_id", "name", "billingInterval", "price", "currency", "active"]
        : type === "subscriptions"
          ? [
              "_id",
              "customer",
              "plan",
              "startDate",
              "status",
              "cancellationDate",
              "cancellationEffectiveDate",
              "cancellationReason",
              "autoRenew",
            ]
          : type === "events"
            ? [
                "_id",
                "subscription",
                "type",
                "occurredAt",
                "previousStatus",
                "newStatus",
                "reason",
              ]
            : [
                "_id",
                "customer",
                "subscription",
                "activityType",
                "quantity",
                "eventAt",
              ];
  const cell = (value) => {
    let raw =
      value && typeof value === "object"
        ? value._id
          ? value._id
          : JSON.stringify(value)
        : (value ?? "");
    raw = String(raw).replace(/[\r\n]+/g, " ");
    if (/^[=+@\-]/.test(raw)) raw = `'${raw}`;
    return `"${raw.replace(/"/g, '""')}"`;
  };
  const csv = [
    cols.join(","),
    ...rows.map((row) => cols.map((col) => cell(row[col])).join(",")),
  ].join("\r\n");
  res.type("text/csv").attachment(`${type}.csv`).send(csv);
});
export const analyticsTrends = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to)
    throw new ApiError(400, "Invalid date range");
  const dateFormat = "%Y-%m";
  if (kind === "revenue") {
    const rows = await Subscription.find({
      status: { $in: ["active", "past_due"] },
      startDate: { $lte: to },
    }).populate("plan");
    const monthRows = Array.from({ length: 12 }, (_, offset) => {
      const date = new Date(to.getFullYear(), to.getMonth() - (11 - offset), 1);
      const key = date.toISOString().slice(0, 7);
      const mrr = rows.reduce(
        (sum, sub) =>
          sub.plan && sub.plan.price > 0 && sub.startDate <= date
            ? sum +
              (sub.plan.billingInterval === "yearly"
                ? sub.plan.price / 12
                : sub.plan.price)
            : sum,
        0,
      );
      return { month: key, estimatedMrr: Number(mrr.toFixed(2)) };
    }).filter(
      (item) =>
        item.month >= from.toISOString().slice(0, 7) &&
        item.month <= to.toISOString().slice(0, 7),
    );
    return send(res, monthRows);
  }
  if (kind === "cancellations") {
    const data = await SubscriptionEvent.aggregate([
      { $match: { type: "cancelled", occurredAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            month: {
              $dateToString: { format: dateFormat, date: "$occurredAt" },
            },
            reason: "$reason",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);
    return send(res, data);
  }
  if (kind === "status") {
    const data = await Subscription.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return send(res, data);
  }
  throw new ApiError(404, "Unknown analytics trend");
});
export const usageSummary = asyncHandler(async (req, res) => {
  const group = ["day", "week", "month"].includes(req.query.by)
    ? req.query.by
    : "day";
  const dateFormat =
    group === "month" ? "%Y-%m" : group === "week" ? "%G-W%V" : "%Y-%m-%d";
  const data = await UsageRecord.aggregate([
    {
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: "$eventAt" } },
          activityType: "$activityType",
        },
        count: { $sum: "$quantity" },
        events: { $sum: 1 },
      },
    },
    { $sort: { "_id.period": 1 } },
  ]);
  return send(res, data);
});
