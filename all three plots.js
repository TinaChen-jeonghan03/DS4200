///////////////////////////////////////////////////////////////////////////////
// 1) BOX PLOT
///////////////////////////////////////////////////////////////////////////////

// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Proceed with plotting
socialMedia.then(function(data) {
    // Convert string values (Likes) to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 20, bottom: 50, left: 70 },
        width  = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Create the SVG container to plotbox
    const svg = d3.select("#plotBox")
        .append("svg")
        .attr("width",  width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales for x and y axes
    // xScale for platforms, yScale for Likes
    const platforms = [...new Set(data.map(d => d.Platform))];
    const xScale = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .paddingInner(0.2);

    // Do a fixed range [0, 1000], or use the min and max
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0])
        .nice();

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Number of Likes");

    // Define a rollup function to get min, q1, median, q3, max, etc.
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min    = d3.min(values);
        const q1     = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3     = d3.quantile(values, 0.75);
        const max    = d3.max(values);
        return {min, q1, median, q3, max};
    };

    // Group data by platform and compute quartiles
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    // For each platform, draw the vertical line (whisker), box, and median line
    quantilesByGroups.forEach((stats, platform) => {
        const xPos    = xScale(platform);
        const boxW    = xScale.bandwidth() * 0.8; // a bit narrower than the band
        const xCenter = xPos + xScale.bandwidth() / 2;

        // Draw vertical line from min to max
        svg.append("line")
            .attr("x1", xCenter)
            .attr("x2", xCenter)
            .attr("y1", yScale(stats.min))
            .attr("y2", yScale(stats.max))
            .attr("stroke", "black");

        // Draw box from q1 to q3
        svg.append("rect")
            .attr("x", xCenter - boxW / 2)
            .attr("width", boxW)
            .attr("y", yScale(stats.q3))
            .attr("height", yScale(stats.q1) - yScale(stats.q3))
            .attr("fill", "#ccc")
            .attr("stroke", "black");

        // Draw median line
        svg.append("line")
            .attr("x1", xCenter - boxW / 2)
            .attr("x2", xCenter + boxW / 2)
            .attr("y1", yScale(stats.median))
            .attr("y2", yScale(stats.median))
            .attr("stroke", "black");
    });
});


///////////////////////////////////////////////////////////////////////////////
// 2) SIDE-BY-SIDE BAR PLOT
///////////////////////////////////////////////////////////////////////////////

// Prepare data and load it.
// socialMediaAvg.csv should contain columns: Platform, PostType, AvgLikes
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert AvgLikes to numbers
    data.forEach(d => {
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 20, bottom: 50, left: 70 },
        width  = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Create the SVG container to plotBars
    const svg = d3.select("#plotBars")
        .append("svg")
        .attr("width",  width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define four scales:
    // x0 for platform
    const platforms = [...new Set(data.map(d => d.Platform))];
    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .paddingInner(0.1);

    // x1 for post type
    const postTypes = [...new Set(data.map(d => d.PostType))];
    const x1 = d3.scaleBand()
        .domain(postTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    // y for AvgLikes
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height, 0])
        .nice();

    // color scale for post types
    const color = d3.scaleOrdinal()
        .domain(postTypes)
        .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);

    // Add the x and y axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Average Likes");

    // Create the grouped bars
    // We group by platform, then within each platform we have multiple post types
    const platformGroup = svg.selectAll(".platformGroup")
        .data(platforms)
        .enter()
        .append("g")
        .attr("class", "platformGroup")
        .attr("transform", d => `translate(${x0(d)}, 0)`);

    // Draw bars within each platform group
    platformGroup.selectAll("rect")
        .data(d => data.filter(item => item.Platform === d))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));

    // Add a legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, ${margin.top})`);

    const types = [...new Set(data.map(d => d.PostType))];

    types.forEach((type, i) => {
        // Small color box
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(type));

        // Text for the legend
        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 12)
            .text(type)
            .attr("alignment-baseline", "middle");
    });
});


///////////////////////////////////////////////////////////////////////////////
// 3) LINE PLOT
///////////////////////////////////////////////////////////////////////////////

// Prepare data and load it.
// socialMediaTime.csv should contain two columns: Date (3/1-3/7) and AvgLikes.
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values (AvgLikes) to numbers
    data.forEach(d => {
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 20, bottom: 60, left: 70 },
        width  = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Create the SVG container to plotLine
    const svg = d3.select("#plotLine")
        .append("svg")
        .attr("width",  width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales for x and y axes
    // If your Date column is just strings like "3/1", "3/2", etc., you can treat them as an ordinal scale:
    const x = d3.scaleBand()
        .domain(data.map(d => d.Date))
        .range([0, width])
        .paddingInner(0.1);

    // Alternatively, if you prefer a time scale, parse the date strings with d3.timeParse
    // Then use d3.scaleTime(). For brevity, let's keep it simple with scaleBand.

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .range([height, 0])
        .nice();

    // Draw the x-axis (rotate labels if needed)
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    xAxis.selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    // Draw the y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text("Date");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Average Likes");

    // Draw the line path with curveNatural
    const lineGenerator = d3.line()
        .x(d => x(d.Date) + x.bandwidth() / 2) // center in the band
        .y(d => y(d.AvgLikes))
        .curve(d3.curveNatural);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // Draw circles at each data point
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.Date) + x.bandwidth() / 2)
        .attr("cy", d => y(d.AvgLikes))
        .attr("r", 4)
        .attr("fill", "steelblue");
});
