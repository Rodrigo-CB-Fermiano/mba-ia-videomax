"use client";

import { useState } from "react";
import QuotaIndicator from "./quota-indicator";
import UploadZone from "./upload-zone";

export default function UploadClient() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <>
      <QuotaIndicator refreshToken={refreshToken} />
      <UploadZone onUploadComplete={() => setRefreshToken((t) => t + 1)} />
    </>
  );
}
