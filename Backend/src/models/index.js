import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, default: "" },
  },
  { timestamps: true },
);
const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    company: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
const planSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    billingInterval: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    price: { type: Number, min: 0, required: true },
    currency: { type: String, uppercase: true, default: "USD" },
    features: [String],
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
const subscriptionSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    status: {
      type: String,
      enum: ["trial", "active", "past_due", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    cancellationDate: Date,
    cancellationEffectiveDate: Date,
    cancellationReason: { type: String, default: "" },
    autoRenew: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
const usageSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    activityType: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 1, default: 1 },
    eventAt: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
const eventSchema = new Schema(
  {
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    occurredAt: { type: Date, default: Date.now },
    previousStatus: String,
    newStatus: String,
    reason: String,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const Customer = models.Customer || model("Customer", customerSchema);
export const SubscriptionPlan =
  models.SubscriptionPlan || model("SubscriptionPlan", planSchema);
export const Subscription =
  models.Subscription || model("Subscription", subscriptionSchema);
export const UsageRecord =
  models.UsageRecord || model("UsageRecord", usageSchema);
export const SubscriptionEvent =
  models.SubscriptionEvent || model("SubscriptionEvent", eventSchema);
export const User = models.User || model("User", userSchema);
