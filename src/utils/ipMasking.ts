export const maskIPAddress = (ipAddress: string): string => {
  if (!ipAddress || ipAddress === "unknown") return "masked";
  
  // Handle IPv4
  if (ipAddress.includes(".")) {
    const parts = ipAddress.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.0.0`;
    }
  }
  
  // Handle IPv6
  if (ipAddress.includes(":")) {
    // Mask IPv6 to first 32 bits
    const parts = ipAddress.split(":");
    return `${parts[0]}:${parts[1]}:0:0:0:0:0:0`;
  }
  
  return "masked";
};

export interface AggregatedVisitorData {
  date: string;
  count: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  topReferers: Array<{ referer: string | null; count: number }>;
}

export const aggregateAnalyticsData = (
  rawAnalytics: Array<{
    device: string;
    browser: string;
    os: string;
    referer: string | null;
    accessedAt: Date;
  }>
): AggregatedVisitorData => {
  // Handle empty analytics data
  if (rawAnalytics.length === 0) {
    return {
      date: new Date().toISOString().split("T")[0],
      count: 0,
      devices: {},
      browsers: {},
      operatingSystems: {},
      topReferers: [],
    };
  }

  const dateMap = new Map<string, { count: number; devices: Map<string, number>; browsers: Map<string, number>; os: Map<string, number>; referers: Map<string | null, number> }>();

  rawAnalytics.forEach((record) => {
    const dateString = new Date(record.accessedAt).toISOString().split("T")[0];
    
    if (!dateMap.has(dateString)) {
      dateMap.set(dateString, {
        count: 0,
        devices: new Map(),
        browsers: new Map(),
        os: new Map(),
        referers: new Map(),
      });
    }

    const daily = dateMap.get(dateString)!;
    daily.count += 1;
    
    daily.devices.set(record.device, (daily.devices.get(record.device) || 0) + 1);
    
    daily.browsers.set(record.browser, (daily.browsers.get(record.browser) || 0) + 1);
    
    daily.os.set(record.os, (daily.os.get(record.os) || 0) + 1);
    
    daily.referers.set(record.referer, (daily.referers.get(record.referer) || 0) + 1);
  });

  // Get the most recent date with data
  const sortedDates = Array.from(dateMap.keys()).sort().reverse();
  const latestDate = sortedDates[0] || new Date().toISOString().split("T")[0];
  const latestData = dateMap.get(latestDate)!;

  // Convert Maps to plain objects and arrays
  const topReferers = Array.from(latestData.referers.entries())
    .map(([referer, count]) => ({ referer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    date: latestDate,
    count: latestData.count,
    devices: Object.fromEntries(latestData.devices),
    browsers: Object.fromEntries(latestData.browsers),
    operatingSystems: Object.fromEntries(latestData.os),
    topReferers,
  };
};
