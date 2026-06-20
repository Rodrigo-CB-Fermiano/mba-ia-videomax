"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordSchema } from "@/app/lib/validations/auth";

export function ResetPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(data: ResetPasswordSchema) {
    await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-sm text-gray-700">
          If that email is registered, a reset link has been sent. Check your inbox.
        </p>
        <a href="/login" className="block mt-4 text-sm text-blue-600 hover:underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        <a href="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
