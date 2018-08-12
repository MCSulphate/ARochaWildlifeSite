// Matthew Lester NEA Project - show.js (Data Review Show Page Scripts)

// Produces an array of dates from a date range.
function getDateRange(fromDate, toDate) {
    // Get the number of days between the dates.
    let dayConstant = 1000 * 60 * 60 * 24;
    let days = Math.floor((new Date(toDate).getTime() - new Date(fromDate).getTime()) / dayConstant);

    let dates = [];
    let fromDateObj = new Date(fromDate);
    // Detect if they want to show a whole year.
    if (days === 365 && fromDateObj.getMonth() === 0 && fromDateObj.getDate() === 1) {
        // Set a flag so the labels can be adjusted.
        dates[0] = -1;
        let dayIntervals = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let currentDate = new Date(fromDate);
        for (let i = 0; i < 12; i++) {
            // Subtract a day so it doesn't overflow into the next month, i.e. 1st Jan -> 31st Jan
            currentDate.setDate(currentDate.getDate() + (dayIntervals[i] - 1));
            dates.push(currentDate.toDateString());
            // Add a day to push it into the next month, i.e. 31st Jan -> 1st Feb
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    else {
        // Use different data intervals for different numbers of days.
        // Should only have maximum 20 labels for a graph.
        let dataInterval = 1;
        while (days > dataInterval * 20) {
            dataInterval = dataInterval * 2;
        }

        // Start from the 'to' date - the 'from' can be accounted for later.
        for (let i = days; i >= 0; i = i - dataInterval) {
            let newDate = new Date(toDate);
            newDate.setDate(newDate.getDate() - (days - i));
            dates.unshift(newDate.toDateString());
        }
    }

    return dates;
}

// Counts the number of a species up to a date from the given raw data.
function getNextCount(rawSpeciesData, startDate, endDate) {
    let startDateObj = new Date(startDate);
    let endDateObj = new Date(endDate);
    let rawDates = Object.keys(rawSpeciesData);
    let count = 0;

    rawDates.forEach(date => {
        let dateObj = new Date(date);
        let dateTime = dateObj.getTime();

        // Make sure it's not before the start date or after the end date.
        if (startDate && dateTime <= startDateObj.getTime()) {
            return;
        }
        else if (dateTime > endDateObj.getTime()) {
            return;
        }
        else {
            count += rawSpeciesData[date];
        }
    });

    return count;
}

// Gets the range of dates, generates the data for each species, and returns it in a format used to create a chart.
function getChartData(rawSpeciesData, fromDate, toDate, title) {
    // The colours for the lines.
    const lineColours = [
        "#ff0000",
        "#ffcc00",
        "#009900",
        "#33cccc",
        "#cc33ff"
    ];
    // The colours for the points on the chart.
    const pointColours = [
        "#990000",
        "#b38f00",
        "#006600",
        "#1f7a7a",
        "#730099"
    ];
    // The width of point borders.
    const pointBorderWidth = 2; //px
    // The radius of points on the chart.
    const pointRadius = 2;
    // The radius of the hitbox for points.
    const pointHitRadius = 4;
    // The radius of points when hovered.
    const pointHoverRadius = 3;
    // The width of the lines.
    const lineWidth = 2;

    let dateRange = getDateRange(fromDate, toDate);
    let species = Object.keys(rawSpeciesData);
    let datasets = [];
    
    // Labels for the x axis.
    let labels;
    if (dateRange[0] === -1) {
        dateRange.shift();
        labels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    }
    else {
        labels = dateRange;
    }

    species.forEach((s, index) => {
        let dataset = {
            label: s,
            data: [],
            fill: false,
            borderWidth: lineWidth,
            borderColor: lineColours[index],
            pointBorderColor: pointColours[index],
            pointBorderWidth,
            pointRadius,
            pointHitRadius,
            pointHoverRadius,
        };

        let previousDate;
        dateRange.forEach(date => {
            let nextCount = getNextCount(rawSpeciesData[s], previousDate, date);
            dataset.data.push(nextCount);
            previousDate = date;
        });

        datasets.push(dataset);
    });

    let chartData = {
        type: "line",
        data: {
            labels,
            datasets
        },
        options: {
            elements: {
                line: {
                    tension: 0 // Disable bezier curves (straight lines only).
                }
            }
        }
    };
    
    // Set the title if given.
    if (title) {
        chartData.options.title = {
            display: true,
            text: title
        };
    }

    return chartData;
}
