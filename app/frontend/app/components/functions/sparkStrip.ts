// sparkStrip.ts
import * as d3 from 'd3';

export interface Answer { question: number; is_correct: boolean; answer: string; }

/**
 * Renders a 100%-width × 50 px Spark-Strip into the given container.
 */
export function renderSparkStrip(
    container: HTMLElement,
    data: Answer[]
): void {
    // select the container
    const sel = d3.select(container);
    sel.selectAll('svg').remove();              // clear old chart

    // dims
    const W = container.clientWidth;
    const H = 100;
    const AH = 60;                              // area-height
    const HH = H - AH;                          // heat-height (8)

    // scales
    const x = d3.scaleLinear().domain([0, data.length]).range([0, W]);
    const y = d3.scaleLinear().domain([0, 1]).range([AH, 0]);

    // svg
    const svg = sel.append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g');

    const ok = '#d4edda';
    const bad = '#f8d7da';

    // 1) pale-red background for the top 42px
    g.append('rect')
        .attr('width', W)
        .attr('height', AH)
        .attr('fill', bad);

    // 2) green step-area (only up to 42px)
    const areaGen = d3.area<Answer>()
        .curve(d3.curveStepAfter)
        .x((_, i) => x(i))
        .y0(AH)
        .y1(d => y(d.is_correct ? 1 : 0));

    g.append('path')
        .datum(data)
        .attr('d', areaGen as any)
        .attr('fill', ok);

    // 3) draw your heat‐strip rects (no text chaining)
    const bw = W / data.length;
    g.selectAll('rect.heat')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'heat')
        .attr('x', (_, i) => x(i))
        .attr('y', AH)
        .attr('width', bw + 0.5)
        .attr('height', HH)
        .attr('fill', d => d.is_correct ? ok : bad);

    // 3b) now append text labels in a separate selection
    g.selectAll('text.heat-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'heat-label')
        // center it in each strip:
        .attr('x', (_, i) => x(i) + bw / 2)
        .attr('y', AH + HH / 2 + 4)           // tweak +4 to vertically center
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .style('font-size', '16px')
        .text(d => `Q${d.question}: ${d.answer}`);

    // 4) optional center text
    const correctCount = data.filter(d => d.is_correct).length;
    svg.append('text')
        .attr('x', W / 2).attr('y', AH / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '16px')
        .style('fill', '#333')
        .text(`${correctCount}/${data.length}`);
}
