"#!use strict";

const manualOveride = new Map;
manualOveride.set('8/22', 33);
manualOveride.set('8/27', 91);
const totalDisplayedDates = 30;

$(function(){
    setupPage();
    
    $("#caseDays").html(totalDisplayedDates);
    $("#updateData").hover(() => {
        $("#updateData").css("background-color", "#000");
    },() => {
        $("#updateData").css("background-color", "rgb(92, 91, 91)");
    });
    $("#updateData").click(function(){
        $("#updateData").css("background-color", "#FFF");
        setupChart().then((res,rej) => {
            $("#updateData").css("background-color", "rgb(92, 91, 91)");
        });
    });

    
});

setupPage = () => {
    // Load google charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(setupChart);
}

//Gets and parses data from the GaTech health page
//parses the data, then sends it to the array.
setupChart = () => {
    return new Promise((resolve,reject) => {
        const graphHeaders = [['Date', 'Number of Cases']];

        $.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://health.gatech.edu/coronavirus/health-alerts')}`, (res) => {  

            resContent = res.contents;

            //Find data with unique start key from webpage
            const startKey = "<h5>Campus Impact</h5>\\n\\t\\t\\t</th>\\n\\t\\t</tr>\\n\\t</thead>\\n\\t<tbody>";
            const startExp = new RegExp(`${startKey}`, 'i');
            //Delete all values before the startExp
            resContent = resContent.slice(startExp.exec(resContent).index);

            const tableStart = /<tbody>/i.exec(resContent).index + 8;
            const tableEnd = /<\/tbody>/i.exec(resContent).index;
            //Set content equal to table content
            resContent = resContent.slice(tableStart, tableEnd);

            //Convert string of data into an array after removing all whitespace "\s"
            const completeTable = 
                $(resContent.replace(/\s/g,'')).get().map(function(row) {
                    return $(row).find('td').get().map(function(cell) {
                    return $(cell).html();
                    });
                });
            
            //Create Array of Dates and # of cases with reversed to go from earliest to latest date

            const sumCases = sumSimilar((completeTable), 0, totalDisplayedDates)
            dateNumArray = sumCases.array;
            totalCases = sumCases.total;
            
            //Display total cases:
            $("#totalCases").html(totalCases);
            
            //Create chart data
            const data = google.visualization.arrayToDataTable(
                graphHeaders.concat(dateNumArray.reverse())
            );

            //Draw the chart with given paramaters
            drawChart(data);

            //Return that the data was successfully aquired
            resolve();
        });
    });
}

//This function adds together the matching dates, returning an array
//with dates and number of cases
sumSimilar = (array, searchKey, max) => {
    const monthMap = getMonthMap(); //Map of month names to numbers
    let finalSummedArray = []; //Array with searchKeys and number of that element
    let total = 0; //Total elements found up to max

    //Iterate through all elements in array or until it reaches the max number to return
    for(let i = 0; i < array.length && finalSummedArray.length < max;){
        let count = 0;
        let element = [];
        let date = array[i][searchKey]; 
        let newDate = date;

        element.push(date); //Add date to element
       
        
        //For each date, itterate until that date changes adding up each occurence
        while(newDate == date){
            count ++;
            i++;
            if (i < array.length){ //Check if the array is still in bounds, 
                newDate = array[i][searchKey];
            }else{ //if not break
                break;
            }
        };

        //Add the count to the element
        element.push(count);
        
        //Format date into mm/dd
        element[0] = formatDate(element[0], monthMap);
        
        //Check manual overide for incorrect counts
        if (manualOveride.has(element[0])){
            element[1] = manualOveride.get(element[0]);
        }

        total = i;
        console.log(`total: ${total}`)
        finalSummedArray.push(element); //Add [searchKey, number] to array
    }
    return {array: finalSummedArray, total: total};
}

//Creates a map of Months to numbers. 
//i.e: January:1, Feburary:2 ... December:12
getMonthMap = () => {
    let monthToNum = new Map();
    const month = [
        'January', 'Feburary', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    for(let i = 0; i < month.length; i++){
        monthToNum.set(month[i], i+1);
    }
    return monthToNum;
}

//Formats date by searching for month in map and retuning
//monthnum/monthday
formatDate = (dateTxt, monthMap) => {
    //Regex match the date with Month in group 1 and day in group 2
    const regex = /([A-Z][a-z]*)([0-9]*)/i;
    monthDay = dateTxt.match(regex);
    
    //Search the month map for the date
    const month = monthMap.get(monthDay[1]);
    return (month + "/" + monthDay[2]);
}

// Draw the chart and set the chart values
drawChart = (data) => {
    //Set table style
    var options = {
        titlePosition: 'none',
        fontSize: 18,
        legend: 'none',
        colors:  ['#B3A369'],
        bar: { groupWidth: "90%" },
        lineWidth: 10,
    };

    // Display the chart inside the <div> element with id="piechart"
    var chart = new google.visualization.ColumnChart(document.getElementById("graph"));
    chart.draw(data,(options));
}

