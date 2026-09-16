"use client";

import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Axis, AxisScale, CountableTimeInterval } from 'd3';
import { getGraphData } from "@/services/activity";

type DataPoint = { period: string; count: number };
type Granularity = "day" | "week" | "month";
type ChartType = "logins" | "exams" | "questions";

// parse both YYYY-MM-DD and ISO week strings like 2025-W31
function parsePeriod(period: string): Date | null {
  const byDate = d3.timeParse("%Y-%m-%d")(period);
  if (byDate) return byDate;

  const isoWeekMatch = period.match(/^(\d{4})-W(\d{2})$/);
  if (isoWeekMatch) {
    const year = +isoWeekMatch[1];
    const week = +isoWeekMatch[2];
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay(); // 0=Sun
    const isoWeek1Start = d3.timeDay.offset(jan4, -((dayOfWeek + 6) % 7)); // Monday of week 1
    return d3.timeWeek.offset(isoWeek1Start, week - 1);
  }
  return null;
}

export default function ActivityGraphs() {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [chartType, setChartType] = useState<ChartType>("logins");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const iso = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate(),
          ).padStart(2, "0")}`;

        const rangeMsMap: Record<Granularity, number> = {
          day: 7 * 24 * 60 * 60 * 1000,      // 1 week (7 days)
          week: 4 * 7 * 24 * 60 * 60 * 1000, // 4 weeks
          month: 12 * 30 * 24 * 60 * 60 * 1000, // 12 months
        };
        const rangeMs = rangeMsMap[granularity];

        const res = await getGraphData({
          type: chartType,
          granularity,
          date_from: iso(new Date(now.getTime() - rangeMs)),
          date_to: iso(now),
        });

        if (res.status === 200) {
          setData(res.data.data || []);
        } else {
          setData([]);
        }
      } catch (e) {
        console.error("Error fetching graph data:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphData();
  }, [granularity, chartType]);

  useEffect(() => {
    if (!svgRef.current || loading) return;

    const margin = { top: 60, right: 30, bottom: 60, left: 80 };
    const fullWidth = 800;
    const fullHeight = 400;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Title
    const title =
      chartType === "logins"
        ? "Login Count Over Time"
        : chartType === "exams"
        ? "Exams Added Over Time"
        : "Questions Added Over Time";

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "600")
      .text(title);

    // Parse incoming data
    const parsed = data
      .map((d) => {
        const date = parsePeriod(d.period);
        if (!date) return null;
        return { date, count: d.count };
      })
      .filter((x): x is { date: Date; count: number } => x !== null);

    // Compute X domain with fallback if sparse
    let xDomain: [Date, Date];
    if (parsed.length >= 3) {
      let [start, end] = d3.extent(parsed, (d) => d.date) as [Date, Date];
      if (start.getTime() === end.getTime()) {
        switch (granularity) {
          case "day":
            start = d3.timeDay.offset(start, -1);
            end = d3.timeDay.offset(end, 1);
            break;
          case "week":
            start = d3.timeWeek.offset(start, -1);
            end = d3.timeWeek.offset(end, 1);
            break;
          case "month":
            start = d3.timeMonth.offset(start, -1);
            end = d3.timeMonth.offset(end, 1);
            break;
        }
      }
      xDomain = [start, end];
    } else {
      const now = new Date();
      switch (granularity) {
        case "day":
          xDomain = [d3.timeDay.offset(now, -6), now]; // last 7 days
          break;
        case "week": {
          const weekNow = d3.timeWeek.floor(now);
          xDomain = [d3.timeWeek.offset(weekNow, -3), weekNow]; // last 4 weeks
          break;
        }
        case "month": {
          const monthNow = d3.timeMonth.floor(now);
          xDomain = [d3.timeMonth.offset(monthNow, -11), monthNow]; // last 12 months
          break;
        }
        default:
          xDomain = [d3.timeDay.offset(now, -6), now];
      }
    }

    // Y domain - responsive to any data range
    const maxCount = parsed.length > 0 ? d3.max(parsed, (d) => d.count) ?? 0 : 0;
    let yDomain: [number, number];
    
    if (parsed.length > 0) {
      // Calculate a nice upper bound based on data
      const upperBound = maxCount * 1.2; // 20% padding above max value
      const niceUpperBound = Math.ceil(upperBound / Math.pow(10, Math.floor(Math.log10(upperBound)))) * Math.pow(10, Math.floor(Math.log10(upperBound)));
      yDomain = [0, Math.max(niceUpperBound, maxCount + 1)];
    } else {
      // Default range when no data
      yDomain = [0, chartType === "logins" ? 50 : 10];
    }

    // Scales
    const xScale = d3.scaleTime().domain(xDomain).range([0, width]).nice();
    const yScale = d3.scaleLinear().domain(yDomain).range([height, 0]).nice();

    // Tick formatting
    const fmtDay = d3.timeFormat("%b %d %H:%M");
    const fmtWeek = d3.timeFormat("%b %d");
    const fmtMonth = d3.timeFormat("%b %d");

    // X axis construction with appropriate sampling
    let xAxis: Axis<Date>;
// compute span in days for conditional logic
const totalDays = Math.max(1, d3.timeDay.count(d3.timeDay.floor(xDomain[0]), d3.timeDay.ceil(xDomain[1])));
switch (granularity) {
  case "day": {
    if (totalDays <= 2) {
      xAxis = d3.axisBottom<Date>(xScale)
        .ticks(d3.timeHour.every(2) as CountableTimeInterval)
        .tickFormat(fmtDay as (domainValue: Date, index: number) => string);
    } else {
      xAxis = d3.axisBottom<Date>(xScale)
        .tickValues(xScale.ticks(7))
        .tickFormat(fmtDay as (domainValue: Date, index: number) => string);
    }
    break;
  }
  case "week": {
    // one tick per week, cap at 5: generate weekly ticks, sample if more than 5
    let weekTicks = xScale.ticks(d3.timeWeek.every(1) as CountableTimeInterval);
    if (weekTicks.length > 5) {
      const step = Math.ceil(weekTicks.length / 5);
      weekTicks = weekTicks.filter((_, i) => i % step === 0);
      // ensure last and first present
      if (weekTicks[weekTicks.length - 1].getTime() !== xDomain[1].getTime()) {
        weekTicks.push(xDomain[1]);
      }
    }
    xAxis = d3.axisBottom<Date>(xScale)
      .tickValues(weekTicks)
      .tickFormat(fmtWeek as (domainValue: Date, index: number) => string);
    break;
  }
  case "month": {
    // daily ticks over 31 days, cap at 12 labels
    let dayTicks = xScale.ticks(d3.timeDay.every(1) as CountableTimeInterval);
    if (dayTicks.length > 12) {
      const step = Math.ceil(dayTicks.length / 12);
      dayTicks = dayTicks.filter((_, i) => i % step === 0);
      if (dayTicks[dayTicks.length - 1].getTime() !== xDomain[1].getTime()) {
        dayTicks.push(xDomain[1]);
      }
    }
    xAxis = d3.axisBottom<Date>(xScale)
      .tickValues(dayTicks)
      .tickFormat(fmtMonth as (domainValue: Date, index: number) => string);
    break;
  }
  default:
    xAxis = d3.axisBottom<Date>(xScale).ticks(5);
}

    // Y axis with responsive tick spacing
    const yAxis = (() => {
      const range = yDomain[1] - yDomain[0];
      let tickCount = 6; // Default number of ticks
      
      if (range > 0) {
        // Calculate appropriate tick interval
        const roughInterval = range / tickCount;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
        const normalizedInterval = roughInterval / magnitude;
        
        let niceInterval;
        if (normalizedInterval <= 1) niceInterval = 1;
        else if (normalizedInterval <= 2) niceInterval = 2;
        else if (normalizedInterval <= 5) niceInterval = 5;
        else niceInterval = 10;
        
        const finalInterval = niceInterval * magnitude;
        const tickValues = d3.range(0, yDomain[1] + finalInterval * 0.1, finalInterval);
        
        return d3.axisLeft(yScale).tickValues(tickValues);
      }
      
      return d3.axisLeft(yScale).ticks(tickCount);
    })();

    // draw axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
    svg.append("g").call(yAxis);

    // axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Date");

    const yLabel = chartType === "logins" ? "Login Count" : chartType === "exams" ? "Exam Count" : "Question Count";
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(yLabel);

    // no data fallback
    if (parsed.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#9CA3AF")
        .text("No data available for the selected period");
      return;
    }

    // infer bar width (time-based)
    const inferInterval = () => {
      if (parsed.length < 2) {
        const unit =
          granularity === "day"
            ? d3.timeHour
            : granularity === "week"
            ? d3.timeWeek
            : d3.timeDay;
        return xScale(unit.offset(parsed[0].date, 1)) - xScale(parsed[0].date);
      }
      const diffs = parsed.slice(1).map((d, i) => xScale(d.date) - xScale(parsed[i].date));
      return d3.mean(diffs) ?? width / parsed.length;
    };
    const barWidth = Math.max(4, inferInterval() * 0.8);

    // draw series
    if (chartType === "exams") {
      svg
        .selectAll("rect.bar")
        .data(parsed)
        .join("rect")
        .attr("class", "bar")
        .attr("x", (d) => xScale(d.date) - barWidth / 2)
        .attr("y", (d) => yScale(d.count))
        .attr("width", barWidth)
        .attr("height", (d) => height - yScale(d.count))
        .attr("fill", "#3774E5")
        .attr("opacity", 0.8);
    } else if (chartType === "questions") {
      svg
        .selectAll("circle.dot")
        .data(parsed)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.count))
        .attr("r", 4)
        .attr("fill", "#10B981")
        .attr("opacity", 0.7);
    } else {
      const line = d3
        .line<{ date: Date; count: number }>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.count))
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(parsed)
        .attr("fill", "none")
        .attr("stroke", "#4F39F6")
        .attr("stroke-width", 2)
        .attr("d", line);

      svg
        .selectAll("circle.dot")
        .data(parsed)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.count))
        .attr("r", 3)
        .attr("fill", "#4F39F6");
    }
  }, [data, granularity, chartType, loading]);

  return (
    <div className="flex flex-col bg-white rounded-2xl p-4">
      <div className="flex gap-4 mb-4">
        <select value={granularity} onChange={(e) => setGranularity(e.target.value as Granularity)} className="p-2 border rounded" disabled={loading}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>

        <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)} className="p-2 border rounded" disabled={loading}>
          <option value="logins">Login Count</option>
          <option value="exams">Exam Count</option>
          <option value="questions">Question Count</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center w-full h-[400px] text-gray-500">Loading chart data...</div>
      ) : (
        <svg ref={svgRef} width="100%" height="400" />
      )}
    </div>
  );
}
