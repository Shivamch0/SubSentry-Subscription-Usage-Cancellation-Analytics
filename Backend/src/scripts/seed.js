import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import {
  Customer,
  SubscriptionPlan,
  Subscription,
  UsageRecord,
  SubscriptionEvent,
} from "../models/index.js";

await connectDB();
const plans = await Promise.all(
  [
    {
      name: "Starter",
      billingInterval: "monthly",
      price: 19,
      currency: "USD",
      features: ["Core workspace", "Email support"],
    },
    {
      name: "Growth",
      billingInterval: "monthly",
      price: 59,
      currency: "USD",
      features: ["Advanced analytics", "Team access"],
    },
    {
      name: "Scale",
      billingInterval: "yearly",
      price: 588,
      currency: "USD",
      features: ["Unlimited projects", "Priority support"],
    },
  ].map(async (data) =>
    SubscriptionPlan.findOneAndUpdate(
      { name: data.name, isDemo: true },
      { $set: { ...data, active: true, isDemo: true } },
      { upsert: true, new: true },
    ),
  ),
);
const reasons = [
  "Missing features",
  "Budget constraints",
  "No longer needed",
  "Switched provider",
];
for (let index = 0; index < 24; index += 1) {
  const customer = await Customer.findOneAndUpdate(
    { email: `demo.customer.${index + 1}@example.test` },
    {
      $set: {
        name: `Demo Customer ${String(index + 1).padStart(2, "0")}`,
        email: `demo.customer.${index + 1}@example.test`,
        company: `Demo Company ${index + 1}`,
        status: "active",
        isDemo: true,
      },
    },
    { upsert: true, new: true },
  );
  const oldSubscription = await Subscription.findOne({
    customer: customer._id,
    isDemo: true,
  });
  if (!oldSubscription) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (index % 12));
    const cancelled = index % 5 === 0;
    const subscription = await Subscription.create({
      customer: customer._id,
      plan: plans[index % plans.length]._id,
      startDate,
      status: cancelled ? "cancelled" : index % 11 === 0 ? "trial" : "active",
      autoRenew: !cancelled,
      cancellationDate: cancelled
        ? new Date(startDate.getTime() + 90 * 86400000)
        : undefined,
      cancellationEffectiveDate: cancelled
        ? new Date(startDate.getTime() + 90 * 86400000)
        : undefined,
      cancellationReason: cancelled ? reasons[index % reasons.length] : "",
      isDemo: true,
    });
    if (cancelled)
      await SubscriptionEvent.create({
        subscription: subscription._id,
        type: "cancelled",
        previousStatus: "active",
        newStatus: "cancelled",
        occurredAt: subscription.cancellationDate,
        reason: subscription.cancellationReason,
        isDemo: true,
      });
    for (let eventIndex = 0; eventIndex < 8; eventIndex += 1) {
      const eventAt = new Date();
      eventAt.setMonth(eventAt.getMonth() - eventIndex);
      await UsageRecord.create({
        customer: customer._id,
        subscription: subscription._id,
        activityType: ["project_created", "report_viewed", "team_invited"][
          eventIndex % 3
        ],
        quantity: 1 + ((index + eventIndex) % 4),
        eventAt,
        isDemo: true,
      });
    }
  }
}
console.log(
  "Demo data seeded (24 customers, 3 plans, subscriptions, usage and cancellation events).",
);
await mongoose.disconnect();
